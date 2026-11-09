/**
 * Pravila darilnih škatel (Z50–Z53, P6–P8). Čiste funkcije brez baze:
 * uporabljajo jih admin (validacija programov), košarica, konfigurator in
 * oddaja naročila. Datoteko doseže konfiguracija Payloada, zato uvaža samo
 * relativno.
 */

/** DDV darilne škatle (P5); vsebina nosi stopnje svojih izdelkov. */
export const STOPNJA_DDV_SKATLE = 22;

/** Sporočilo na kartici (Z54). */
export const NAJDALJSE_SPOROCILO = 300;

/** Varovalka: največ mest v eni škatli (admin ne dovoli več). */
export const NAJVEC_MEST = 24;

export interface KosVsebine {
  izdelekId: number;
  velikostId: string;
  kolicina: number;
}

/** Ključ velikosti v vsebini škatle. */
export const kljucVsebine = (v: Pick<KosVsebine, "izdelekId" | "velikostId">) => `${v.izdelekId}:${v.velikostId}`;

/** Število zasedenih mest (1 kos = 1 mesto, P7). */
export function zasedenaMesta(vsebina: readonly Pick<KosVsebine, "kolicina">[]): number {
  return vsebina.reduce((vsota, v) => vsota + v.kolicina, 0);
}

/**
 * Vsebina z združenimi enakimi velikostmi, brez neveljavnih količin in z
 * največ `NAJVEC_MEST` kosi (presežek se odreže). Vrstni red ostane.
 */
export function zdruziVsebino<T extends KosVsebine>(vsebina: readonly T[]): T[] {
  const izid: T[] = [];
  let mest = 0;
  for (const v of vsebina) {
    const kolicina = Math.min(Math.floor(v.kolicina), NAJVEC_MEST - mest);
    if (!(kolicina >= 1)) continue;
    mest += kolicina;
    const obstojeca = izid.find((x) => kljucVsebine(x) === kljucVsebine(v));
    if (obstojeca) obstojeca.kolicina += kolicina;
    else izid.push({ ...v, kolicina });
  }
  return izid;
}

/** Izdelek, kot ga potrebuje preverjanje vsebine programa ali škatle. */
export interface IzdelekZaDarilo {
  id: number;
  ime: string;
  nacinProdaje: string;
  primernoZaDarilo: boolean;
  velikosti: ReadonlyArray<{ id: string; oznaka: string }>;
}

/** Z52, P6: v škatlo sme le izdelek, ki je primeren za darilo in se lahko pošlje. */
export const primerenZaDarilo = (i: Pick<IzdelekZaDarilo, "nacinProdaje" | "primernoZaDarilo">) =>
  i.primernoZaDarilo && i.nacinProdaje === "posta-in-prevzem";

/**
 * Velikost izdelka iz vnosa v adminu: prazno pomeni prvo velikost, sicer
 * id ali oznaka velikosti (urednik id-ja ne pozna, oznako pa). Vrne `null`,
 * če velikosti ni.
 */
export function poisciVelikost<V extends { id: string; oznaka: string }>(
  izdelek: { velikosti: readonly V[] },
  vnos: string | null | undefined,
): V | null {
  const iskano = (vnos ?? "").trim();
  if (!iskano) return izdelek.velikosti[0] ?? null;
  const malo = iskano.toLocaleLowerCase("sl");
  return (
    izdelek.velikosti.find((v) => v.id === iskano) ??
    izdelek.velikosti.find((v) => v.oznaka.trim().toLocaleLowerCase("sl") === malo) ??
    null
  );
}

export interface NapakaPrograma {
  /** Pot do polja v adminu, npr. `vsebina.1.izdelek`. */
  pot: string;
  sporocilo: string;
}

/**
 * Validacija programa ob shranjevanju (Z51): vsota količin ≤ mest škatle,
 * vsi izdelki primerni za darilo, velikosti obstajajo. Vrne seznam napak
 * (prazen, če je program veljaven).
 */
export function preveriProgram(
  vsebina: ReadonlyArray<{ izdelekId: number | null; velikost: string | null; kolicina: number | null }>,
  steviloMest: number | null,
  izdelki: ReadonlyMap<number, IzdelekZaDarilo>,
): NapakaPrograma[] {
  const napake: NapakaPrograma[] = [];
  if (vsebina.length === 0) {
    napake.push({ pot: "vsebina", sporocilo: "Dodajte vsaj en izdelek v vsebino programa." });
  }
  vsebina.forEach((v, i) => {
    const izdelek = v.izdelekId != null ? izdelki.get(v.izdelekId) : undefined;
    if (!izdelek) {
      napake.push({ pot: `vsebina.${i}.izdelek`, sporocilo: "Izberite izdelek." });
      return;
    }
    if (!primerenZaDarilo(izdelek)) {
      napake.push({
        pot: `vsebina.${i}.izdelek`,
        sporocilo: `${izdelek.ime} ni primeren za darilno škatlo. Pri izdelku označite „Primerno za darilno škatlo“ (mogoče le pri načinu „Pošta in prevzem na kmetiji“).`,
      });
    }
    if (!poisciVelikost(izdelek, v.velikost)) {
      napake.push({
        pot: `vsebina.${i}.velikostId`,
        sporocilo: `${izdelek.ime} nima velikosti „${v.velikost}“. Vpišite eno od: ${izdelek.velikosti.map((x) => x.oznaka).join(", ")}.`,
      });
    }
    if (v.kolicina == null || !Number.isInteger(v.kolicina) || v.kolicina < 1) {
      napake.push({ pot: `vsebina.${i}.kolicina`, sporocilo: "Količina mora biti celo število, vsaj 1." });
    }
  });
  const mest = vsebina.reduce((vsota, v) => vsota + (v.kolicina ?? 0), 0);
  if (steviloMest != null && mest > steviloMest) {
    napake.push({
      pot: "vsebina",
      sporocilo: `V programu je ${mest} kosov, izbrana škatla pa ima samo ${steviloMest} mest. Zmanjšajte količine ali izberite večjo škatlo.`,
    });
  }
  return napake;
}
