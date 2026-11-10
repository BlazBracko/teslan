import { sql } from "@payloadcms/db-postgres";
import type { Payload, PayloadRequest } from "payload";

/**
 * Neposredni SQL za zalogo in številke naročil (Z30, Z31, Z34). Payloadov
 * lokalni API ne zna zakleniti vrstic in atomarno spremeniti števca, zato
 * ti koraki tečejo kot SQL v isti transakciji kot ostale operacije
 * Payloada (`req.transactionID`).
 *
 * Velikosti izdelkov so v tabeli `izdelki_velikosti` (Payloadov `array`):
 * `id` je id velikosti, `_parent_id` id izdelka.
 */

type Seja = Payload["db"]["drizzle"];

/** Drizzle seja transakcije iz `req` ali, brez nje, privzeta povezava. */
export async function sejaBaze(payload: Payload, req?: Partial<Pick<PayloadRequest, "transactionID">>): Promise<Seja> {
  const id = req?.transactionID != null ? await req.transactionID : null;
  return ((id != null && payload.db.sessions?.[id]?.db) || payload.db.drizzle) as Seja;
}

export interface SpremembaZaloge {
  izdelekId: number;
  velikostId: string;
  kolicina: number;
}

/**
 * Zaklene vrstice velikosti (`FOR UPDATE`) do konca transakcije, urejene
 * po id, da sočasni transakciji ne obstaneta v smrtnem objemu. Vrne
 * trenutno zalogo po id velikosti.
 */
export async function zakleniVelikosti(seja: Seja, velikostIds: readonly string[]): Promise<Map<string, number>> {
  const ids = [...new Set(velikostIds)].sort();
  if (ids.length === 0) return new Map();
  const { rows } = await seja.execute<{ id: string; zaloga: string | number | null }>(
    sql`SELECT id, zaloga FROM izdelki_velikosti WHERE id IN (${sql.join(
      ids.map((id) => sql`${id}`),
      sql`, `,
    )}) ORDER BY id FOR UPDATE`,
  );
  return new Map(rows.map((r) => [r.id, Number(r.zaloga ?? 0)]));
}

/**
 * Zmanjša zalogo, a le, če je je dovolj (`zaloga >= kolicina`). Vrne
 * spremembe, ki jih ni bilo mogoče izvesti; klicatelj tedaj transakcijo
 * razveljavi, zato zaloga nikoli ne pade pod 0 (S6).
 */
export async function zmanjsajZalogo(seja: Seja, spremembe: readonly SpremembaZaloge[]): Promise<SpremembaZaloge[]> {
  const neuspele: SpremembaZaloge[] = [];
  for (const s of spremembe) {
    const { rows } = await seja.execute(
      sql`UPDATE izdelki_velikosti SET zaloga = zaloga - ${s.kolicina}
          WHERE id = ${s.velikostId} AND _parent_id = ${s.izdelekId} AND zaloga >= ${s.kolicina}
          RETURNING id`,
    );
    if (rows.length === 0) neuspele.push(s);
  }
  return neuspele;
}

/** Vrne zalogo; velikosti, ki je medtem ni več, preskoči. Vrne število vrnjenih postavk. */
export async function povecajZalogo(seja: Seja, spremembe: readonly SpremembaZaloge[]): Promise<number> {
  let vrnjene = 0;
  for (const s of spremembe) {
    const { rows } = await seja.execute(
      sql`UPDATE izdelki_velikosti SET zaloga = COALESCE(zaloga, 0) + ${s.kolicina}
          WHERE id = ${s.velikostId} AND _parent_id = ${s.izdelekId}
          RETURNING id`,
    );
    vrnjene += rows.length;
  }
  return vrnjene;
}

export interface SpremembaZalogeSkatel {
  tipSkatleId: number;
  kolicina: number;
}

/** Zaklene vrstice tipov škatel (`FOR UPDATE`), urejene po id, kot `zakleniVelikosti`. */
export async function zakleniTipeSkatel(seja: Seja, ids: readonly number[]): Promise<void> {
  const urejeni = [...new Set(ids)].sort((a, b) => a - b);
  if (urejeni.length === 0) return;
  await seja.execute(
    sql`SELECT id FROM tipi_skatel WHERE id IN (${sql.join(
      urejeni.map((id) => sql`${id}`),
      sql`, `,
    )}) ORDER BY id FOR UPDATE`,
  );
}

/** Zmanjša zalogo škatel, a le, če je je dovolj (P8). Vrne spremembe, ki niso uspele. */
export async function zmanjsajZalogoSkatel(
  seja: Seja,
  spremembe: readonly SpremembaZalogeSkatel[],
): Promise<SpremembaZalogeSkatel[]> {
  const neuspele: SpremembaZalogeSkatel[] = [];
  for (const s of spremembe) {
    const { rows } = await seja.execute(
      sql`UPDATE tipi_skatel SET zaloga = zaloga - ${s.kolicina}
          WHERE id = ${s.tipSkatleId} AND zaloga >= ${s.kolicina}
          RETURNING id`,
    );
    if (rows.length === 0) neuspele.push(s);
  }
  return neuspele;
}

/** Vrne zalogo škatel; tip, ki ga medtem ni več, preskoči. */
export async function povecajZalogoSkatel(seja: Seja, spremembe: readonly SpremembaZalogeSkatel[]): Promise<number> {
  let vrnjene = 0;
  for (const s of spremembe) {
    const { rows } = await seja.execute(
      sql`UPDATE tipi_skatel SET zaloga = COALESCE(zaloga, 0) + ${s.kolicina}
          WHERE id = ${s.tipSkatleId}
          RETURNING id`,
    );
    vrnjene += rows.length;
  }
  return vrnjene;
}

/** Seštevek sprememb zaloge po velikosti (ista velikost je lahko samostojno in v škatlah). */
export function zdruziSpremembe(spremembe: readonly SpremembaZaloge[]): SpremembaZaloge[] {
  const poKljucu = new Map<string, SpremembaZaloge>();
  for (const s of spremembe) {
    const kljuc = `${s.izdelekId}:${s.velikostId}`;
    const obstojeca = poKljucu.get(kljuc);
    if (obstojeca) obstojeca.kolicina += s.kolicina;
    else poKljucu.set(kljuc, { ...s });
  }
  return [...poKljucu.values()];
}

/**
 * Zaklene vrstico naročila (`FOR UPDATE`) do konca transakcije in vrne
 * njen trenutni status. Sočasni spremembi statusa istega naročila tečeta
 * tako po vrsti: druga vidi status, ki ga je zapisala prva (prehod se
 * preveri znova, obvestilo kupcu gre le enkrat).
 */
export async function zakleniStatus(seja: Seja, narociloId: number): Promise<string | null> {
  const { rows } = await seja.execute(sql`SELECT status FROM narocila WHERE id = ${narociloId} FOR UPDATE`);
  return ((rows[0] as { status?: string } | undefined)?.status ?? null);
}

/** Ključ v `req.context` za status pred spremembo (po zaklepu), za vsako naročilo posebej. */
export const kljucPrejsnjegaStatusa = (narociloId: number | string) => `prejsnjiStatus:${narociloId}`;

/**
 * Atomarno označi, da je bila zaloga naročila vrnjena. Vrne `true` samo
 * prvemu klicatelju; vsi nadaljnji (ponovno shranjevanje, sočasen preklic)
 * dobijo `false` in zaloge ne vrnejo še enkrat (Z34, S7).
 */
export async function oznaciZalogoVrnjeno(seja: Seja, narociloId: number): Promise<boolean> {
  const { rows } = await seja.execute(
    sql`UPDATE narocila SET zaloga_vrnjena = true
        WHERE id = ${narociloId} AND COALESCE(zaloga_vrnjena, false) = false
        RETURNING id`,
  );
  return rows.length > 0;
}

/**
 * Zaklep oddaje naročil na ravni transakcije (`pg_advisory_xact_lock`):
 * oddaje tečejo po vrsti, zato dve hkratni naročili ne dobita iste
 * številke in ne prodata istega kosa dvakrat (S6). Sprosti se ob potrditvi
 * ali razveljavitvi transakcije. Vzame se pred zaklepi vrstic, da je
 * vrstni red zaklepov vedno enak (brez smrtnega objema).
 */
export async function zakleniOddajo(seja: Seja): Promise<void> {
  await seja.execute(sql`SELECT pg_advisory_xact_lock(hashtext('teslan-oddaja-narocila'))`);
}

/**
 * Naslednja zaporedna številka naročila v letu (Z31). Klicati jo je treba
 * pod `zakleniOddajo`; unikatni indeks na `stevilka` je varovalka.
 */
export async function naslednjaZaporedna(seja: Seja, predpona: string): Promise<number> {
  const { rows } = await seja.execute<{ najvec: string | number | null }>(
    sql`SELECT MAX(CAST(SUBSTRING(stevilka FROM CAST(${predpona.length + 1} AS integer)) AS integer)) AS najvec
        FROM narocila WHERE stevilka LIKE ${`${predpona}%`}`,
  );
  return Number(rows[0]?.najvec ?? 0) + 1;
}
