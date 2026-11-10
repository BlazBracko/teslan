"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LuCircleAlert, LuGift, LuInfo, LuPlus, LuTrash2 } from "react-icons/lu";
import { SlikaIzdelka } from "@/components/katalog/SlikaIzdelka";
import { POT_DARIL, POT_KOSARICE } from "@/components/postavitev/navigacija";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field } from "@/components/ui/Field";
import { Textarea } from "@/components/ui/Input";
import { Price } from "@/components/ui/Price";
import { QuantityInput } from "@/components/ui/QuantityInput";
import { RadioCard, RadioGroup } from "@/components/ui/RadioGroup";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  cenaSkatle,
  dodajKos,
  najvecKosa,
  nastaviKolicinoKosa,
  prilagodiVsebino,
  prostaMesta,
  vsebinaZaPrikaz,
  type IzdelekZaSkatlo,
} from "@/darila/konfigurator";
import type { TipSkatlePogled } from "@/darila/pogled";
import { kljucVsebine, NAJDALJSE_SPOROCILO, zasedenaMesta, type KosVsebine } from "@/darila/pravila";
import { nastevanje } from "@/kosarica/dostava";
import { novIdSkatle, type PostavkaSkatle } from "@/kosarica/postavke";
import { shraniSkatloVKosarico, useKosarica } from "@/kosarica/shramba";
import { formatirajCeno } from "@/lib/denar";
import { MESTO, stevilo } from "@/lib/sklanjanje";
import { cn } from "@/lib/utils";

/**
 * Konfigurator darilne škatle (T5, Z53, P7, P8, S12). Kupec izbere tip
 * škatle, doda izdelke (samo primerne za darilo; tiste izven sezone ali
 * brez zaloge vidi, a jih ne more dodati), vidi prazna mesta in sprotno
 * ceno ter napiše sporočilo na kartici. Več kosov, kot ima škatla mest,
 * ni mogoče dodati.
 *
 * Cene tu so informativne; košarica in blagajna jih vedno znova izračunata
 * na strežniku (Z20). Nakupni tok je brez okrasnih animacij (Z2).
 */

export interface ZacetekKonfiguratorja {
  tipSkatleId: number | null;
  vsebina: KosVsebine[];
  program: { slug: string; ime: string } | null;
  /** Izdelki iz programa, ki so bili odstranjeni ali zmanjšani (Z53). */
  spremenjeni: string[];
  /** Obvestilo nad konfiguratorjem (npr. neznan program). */
  obvestilo?: string;
}

export interface KonfiguratorProps {
  tipi: TipSkatlePogled[];
  izdelki: IzdelekZaSkatlo[];
  trgovinaOdprta: boolean;
  telefon: string | null;
  telefonPovezava: string | null;
}

/** Stran konfiguratorja: nov začetek ali urejanje škatle iz košarice (`?uredi=<id>`). */
export function KonfiguratorStran({
  uredi,
  zacetek,
  ...props
}: KonfiguratorProps & { uredi: string | null; zacetek: ZacetekKonfiguratorja }) {
  const kosarica = useKosarica();
  if (!uredi) return <Konfigurator {...props} zacetek={zacetek} />;
  if (kosarica === null) return <Nalaganje />;

  const skatla = kosarica.find((p): p is PostavkaSkatle => p.vrsta === "skatla" && p.id === uredi);
  if (!skatla) {
    return (
      <EmptyState
        icon={<LuGift aria-hidden="true" />}
        title="Te škatle ni več v košarici"
        description="Morda ste jo že odstranili ali oddali naročilo. Sestavite lahko novo darilo."
        action={
          <Button asChild>
            <Link href={POT_DARIL}>Na darila</Link>
          </Button>
        }
      />
    );
  }
  const tip = props.tipi.find((t) => t.id === skatla.tipSkatleId);
  const { vsebina, spremenjeni } = prilagodiVsebino(skatla.vsebina, props.izdelki, tip?.steviloMest);
  return (
    <Konfigurator
      key={skatla.id}
      {...props}
      urejanje={skatla}
      zacetek={{
        tipSkatleId: tip ? tip.id : null,
        vsebina,
        program: skatla.program ? { slug: skatla.program, ime: "" } : null,
        spremenjeni,
        obvestilo: tip ? undefined : "Škatle, ki ste jo izbrali, ni več v ponudbi. Izberite drugo.",
      }}
    />
  );
}

function Nalaganje() {
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <p className="sr-only" role="status">
        Nalagam darilo …
      </p>
      <Skeleton className="h-20 w-full rounded-lg" />
      <Skeleton className="h-20 w-full rounded-lg" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}

function Obvestilo({
  naslov,
  children,
  vrsta = "info",
}: {
  naslov: string;
  children?: React.ReactNode;
  vrsta?: "info" | "warning";
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex gap-3 rounded-lg p-4 type-small",
        vrsta === "info" ? "bg-info-soft text-info" : "bg-warning-soft text-warning",
      )}
    >
      {vrsta === "info" ? (
        <LuInfo aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      ) : (
        <LuCircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      )}
      <div className="flex flex-col gap-1">
        <p className="font-semibold">{naslov}</p>
        {children && <p>{children}</p>}
      </div>
    </div>
  );
}

function Korak({ stevilka, naslov, children, id }: { stevilka: number; naslov: string; children: React.ReactNode; id: string }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-5 border-t border-line pt-6 first:border-t-0 first:pt-0">
      <h2 id={id} className="type-h3 text-ink">
        <span className="text-ink-subtle">{stevilka}. </span>
        {naslov}
      </h2>
      {children}
    </section>
  );
}

/**
 * Izdelek v konfiguratorju kot velika ploščica: klik kamorkoli doda en kos
 * (prej majhen gumb „Dodaj“). Število v škatli je v kotu; nedosegljive
 * velikosti so vidne, a onemogočene, z razlogom.
 */
function PloscicaIzdelka({
  izdelek: i,
  velikost: v,
  vSkatli,
  mogoce,
  onDodaj,
}: {
  izdelek: IzdelekZaSkatlo;
  velikost: IzdelekZaSkatlo["velikosti"][number];
  vSkatli: number;
  mogoce: boolean;
  onDodaj: () => void;
}) {
  return (
    <button
      type="button"
      disabled={!mogoce}
      onClick={onDodaj}
      aria-label={[
        `Dodaj v škatlo: ${i.ime}, ${v.oznaka}`,
        v.cenaCenti != null && v.narocljiva && formatirajCeno(v.cenaCenti),
        !v.narocljiva && v.oznakaRazpolozljivosti,
        vSkatli > 0 && `V škatli: ${vSkatli}`,
      ]
        .filter(Boolean)
        .join(" · ")}
      className={cn(
        "group relative flex h-full w-full flex-col overflow-hidden rounded-xl bg-surface text-left shadow-raised ring-1 ring-line",
        "transition-[transform,box-shadow] duration-(--duration-fast) ease-(--ease-out-soft)",
        "hover:shadow-floating active:scale-[0.97] motion-reduce:active:scale-100",
        "disabled:cursor-not-allowed disabled:shadow-none disabled:active:scale-100",
        vSkatli > 0 && "ring-2 ring-brand",
      )}
    >
      {/* Slika je okras; ime gumba vsebuje vse vidno besedilo v istem vrstnem redu (axe). */}
      <span aria-hidden="true" className="relative block">
        <SlikaIzdelka
          slika={i.slika}
          sizes="(min-width: 1280px) 10rem, (min-width: 640px) 30vw, 45vw"
          className={cn("aspect-[4/3] w-full", !v.narocljiva && "opacity-50")}
        />
        {v.narocljiva && (
          <span
            className={cn(
              "absolute right-2 bottom-2 grid size-9 place-items-center rounded-full shadow-floating",
              "transition-transform duration-(--duration-fast) group-hover:scale-110 group-disabled:scale-100",
              mogoce ? "bg-brand text-on-brand" : "bg-surface-muted text-ink-subtle",
            )}
          >
            <LuPlus className="size-5" />
          </span>
        )}
      </span>
      <span className="flex flex-1 flex-col gap-0.5 p-3">
        <span className="type-small font-medium text-ink">{i.ime}</span>
        {/* Presledek med vrsticami, da se vidno besedilo ujema z imenom gumba (axe). */}{" "}
        <span className="type-caption text-ink-muted">
          {v.oznaka}
          {v.cenaCenti != null && v.narocljiva && <> · {formatirajCeno(v.cenaCenti)}</>}
        </span>
        {!v.narocljiva && " "}
        {!v.narocljiva && (
          <span className="type-caption font-medium text-ink-subtle">
            {v.oznakaRazpolozljivosti}
          </span>
        )}
      </span>
      {vSkatli > 0 && (
        <span className="absolute top-2 left-2 rounded-full bg-brand px-2.5 py-1 type-caption font-semibold text-on-brand shadow-raised">
          {" "}V škatli: {vSkatli}
        </span>
      )}
    </button>
  );
}

export function Konfigurator({
  tipi,
  izdelki,
  trgovinaOdprta,
  telefon,
  telefonPovezava,
  zacetek,
  urejanje,
}: KonfiguratorProps & { zacetek: ZacetekKonfiguratorja; urejanje?: PostavkaSkatle }) {
  const router = useRouter();
  const [tipId, setTipId] = useState<number | null>(
    zacetek.tipSkatleId ?? tipi.find((t) => t.zaloga > 0)?.id ?? null,
  );
  const [vsebina, setVsebina] = useState<KosVsebine[]>(zacetek.vsebina);
  const [sporocilo, setSporocilo] = useState(urejanje?.sporocilo ?? "");
  const [napaka, setNapaka] = useState<string | null>(null);

  const tip = tipi.find((t) => t.id === tipId) ?? null;
  const steviloMest = tip?.steviloMest ?? 0;
  const prikaz = useMemo(() => vsebinaZaPrikaz(vsebina, izdelki), [vsebina, izdelki]);
  const zasedeno = zasedenaMesta(vsebina);
  const prosto = prostaMesta(vsebina, steviloMest);
  const prevec = tip !== null && zasedeno > steviloMest;
  const cena = tip ? cenaSkatle(tip.cenaCenti, prikaz) : null;
  const lahkoVKosarico = trgovinaOdprta && tip !== null && tip.zaloga > 0 && vsebina.length > 0 && !prevec;

  // Ena sličica na zasedeno mesto, v vrstnem redu vsebine.
  const kosiVSkatli = useMemo(
    () =>
      vsebina.flatMap((k) => {
        const slika = izdelki.find((i) => i.id === k.izdelekId)?.slika ?? null;
        return Array.from({ length: k.kolicina }, () => ({ slika }));
      }),
    [vsebina, izdelki],
  );

  const kategorije = useMemo(() => {
    const poKategoriji = new Map<string, IzdelekZaSkatlo[]>();
    for (const i of izdelki) poKategoriji.set(i.kategorija, [...(poKategoriji.get(i.kategorija) ?? []), i]);
    return [...poKategoriji];
  }, [izdelki]);

  function vKosarico() {
    if (!tip || !lahkoVKosarico) return;
    const program = zacetek.program?.slug;
    const ok = shraniSkatloVKosarico({
      vrsta: "skatla",
      id: urejanje?.id ?? novIdSkatle(),
      tipSkatleId: tip.id,
      ...(program ? { program } : {}),
      vsebina,
      ...(sporocilo.trim() ? { sporocilo: sporocilo.trim() } : {}),
      kolicina: urejanje?.kolicina ?? 1,
    });
    if (!ok) {
      setNapaka("Košarica je polna. Odstranite kakšno postavko in poskusite znova.");
      return;
    }
    router.push(POT_KOSARICE);
  }

  if (tipi.length === 0) {
    return (
      <EmptyState
        icon={<LuGift aria-hidden="true" />}
        title="Darilnih škatel ta čas ni"
        description="Pokličite nas, pa se dogovorimo za darilo po vaši želji."
      />
    );
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
      <div className="flex min-w-0 flex-col gap-8">
        {zacetek.obvestilo && <Obvestilo naslov={zacetek.obvestilo} vrsta="warning" />}
        {zacetek.spremenjeni.length > 0 && (
          <Obvestilo naslov="Nekaterih izdelkov ta čas ni" vrsta="warning">
            {nastevanje(zacetek.spremenjeni)}: izdelka ni na zalogi ali ni v sezoni, zato smo ga odstranili ali
            zmanjšali količino. Namesto njega lahko izberete drug izdelek.
          </Obvestilo>
        )}

        <Korak stevilka={1} naslov="Izberite škatlo" id="korak-skatla">
          <Field label="Darilna škatla" group hideLabel>
            <RadioGroup value={tipId != null ? String(tipId) : ""} onValueChange={(v) => setTipId(Number(v))}>
              {tipi.map((t) => (
                <RadioCard
                  key={t.id}
                  value={String(t.id)}
                  disabled={t.zaloga <= 0}
                  title={t.ime}
                  description={[stevilo(t.steviloMest, MESTO), t.zaloga <= 0 ? "Ni na zalogi" : t.opis]
                    .filter(Boolean)
                    .join(" · ")}
                  aside={formatirajCeno(t.cenaCenti)}
                />
              ))}
            </RadioGroup>
          </Field>
        </Korak>

        <Korak stevilka={2} naslov="Napolnite škatlo" id="korak-vsebina">
          <div className="flex flex-col gap-3">
            <p role="status" className="type-body font-medium text-ink" data-testid="mesta">
              {tip ? `Zasedena mesta: ${zasedeno} od ${steviloMest}` : "Najprej izberite škatlo."}
            </p>
            {tip && (
              <ol aria-hidden="true" className="flex flex-wrap gap-2 rounded-xl bg-surface-muted p-3">
                {Array.from({ length: Math.max(steviloMest, zasedeno) }, (_, i) => {
                  const kos = kosiVSkatli[i];
                  return (
                    <li
                      key={i}
                      className={cn(
                        "relative grid size-14 place-items-center overflow-hidden rounded-lg",
                        kos
                          ? i < steviloMest
                            ? "bg-surface ring-2 ring-brand"
                            : "bg-surface ring-2 ring-danger"
                          : "border-2 border-dashed border-line-strong bg-surface text-ink-subtle",
                      )}
                    >
                      {kos ? (
                        <SlikaIzdelka slika={kos.slika} sizes="56px" className="size-full" />
                      ) : (
                        <LuPlus className="size-4" />
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
            {prevec && (
              <Obvestilo naslov="V škatli je preveč izdelkov" vrsta="warning">
                Izbrana škatla ima {stevilo(steviloMest, MESTO)}. Odstranite {zasedeno - steviloMest} ali izberite večjo
                škatlo.
              </Obvestilo>
            )}
          </div>

          {prikaz.length > 0 ? (
            <ul aria-label="V škatli" className="flex flex-col divide-y divide-line rounded-lg ring-1 ring-line">
              {prikaz.map((v) => {
                const kljuc = kljucVsebine(v);
                const opis = `${v.ime}, ${v.velikost}`;
                return (
                  <li key={kljuc} className="flex flex-wrap items-center justify-between gap-3 p-3">
                    <span className="min-w-0 flex-1 type-small text-ink">
                      <span className="font-medium">{v.ime}</span>
                      <span className="text-ink-muted">, {v.velikost} · {formatirajCeno(v.cenaCenti)}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Field label={`Količina v škatli: ${opis}`} hideLabel>
                        <QuantityInput
                          value={v.kolicina}
                          onChange={(n) => setVsebina((s) => nastaviKolicinoKosa(s, kljuc, n, steviloMest, v.zaloga))}
                          min={1}
                          max={Math.max(1, najvecKosa(vsebina, v, steviloMest, v.zaloga))}
                        />
                      </Field>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setVsebina((s) => s.filter((x) => kljucVsebine(x) !== kljuc))}
                        aria-label={`Odstrani iz škatle: ${opis}`}
                      >
                        <LuTrash2 aria-hidden="true" />
                      </Button>
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="rounded-lg bg-surface-muted p-4 type-small text-ink-muted">
              Škatla je prazna. Spodaj dodajte izdelke, ki jih želite podariti.
            </p>
          )}

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <h3 className="type-title text-ink">Izdelki za darilo</h3>
              <p className="type-small text-ink-muted">Kliknite izdelek, da ga dodate v škatlo. Vsak klik doda en kos.</p>
            </div>
            {tip && prosto === 0 && !prevec && (
              <p className="type-small text-ink-muted">Škatla je polna. Za drug izdelek najprej enega odstranite.</p>
            )}
            {kategorije.map(([kategorija, izdelkiKategorije]) => (
              <div key={kategorija} className="flex flex-col gap-3">
                <p className="type-caption font-medium text-ink-subtle">{kategorija}</p>
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {izdelkiKategorije.flatMap((i) =>
                    i.velikosti.map((v) => {
                      const vSkatli = vsebina.find((x) => x.izdelekId === i.id && x.velikostId === v.id)?.kolicina ?? 0;
                      const mogoce = v.narocljiva && tip !== null && prosto > 0 && vSkatli < v.zaloga;
                      return (
                        <li key={`${i.id}:${v.id}`} className="min-w-0">
                          <PloscicaIzdelka
                            izdelek={i}
                            velikost={v}
                            vSkatli={vSkatli}
                            mogoce={mogoce}
                            onDodaj={() =>
                              setVsebina((s) => dodajKos(s, { izdelekId: i.id, velikostId: v.id }, steviloMest, v.zaloga))
                            }
                          />
                        </li>
                      );
                    }),
                  )}
                </ul>
              </div>
            ))}
          </div>
        </Korak>

        <Korak stevilka={3} naslov="Sporočilo na kartici" id="korak-sporocilo">
          <Field
            label="Sporočilo na kartici"
            description={`Neobvezno. Napišemo ga na kartico v škatli. Še ${NAJDALJSE_SPOROCILO - sporocilo.length} znakov.`}
          >
            <Textarea
              rows={3}
              maxLength={NAJDALJSE_SPOROCILO}
              value={sporocilo}
              onChange={(e) => setSporocilo(e.target.value.slice(0, NAJDALJSE_SPOROCILO))}
            />
          </Field>
        </Korak>
      </div>

      <aside
        aria-labelledby="povzetek-darila"
        className="flex flex-col gap-5 rounded-xl bg-surface p-6 shadow-raised ring-1 ring-line lg:sticky lg:top-24"
      >
        <h2 id="povzetek-darila" className="type-h3 text-ink">
          Vaše darilo
        </h2>
        <dl className="flex flex-col gap-3 type-body">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-ink-muted">{tip?.ime ?? "Škatla"}</dt>
            <dd className="type-numeric">{tip ? formatirajCeno(tip.cenaCenti) : "—"}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-ink-muted">Izdelki ({zasedeno})</dt>
            <dd className="type-numeric">{formatirajCeno(prikaz.reduce((s, v) => s + v.cenaCenti * v.kolicina, 0))}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-t border-line pt-3">
            <dt className="font-semibold text-ink">Skupaj</dt>
            <dd data-testid="cena-darila">{cena != null ? <Price cents={cena} size="lg" /> : "—"}</dd>
          </div>
        </dl>
        <p className="type-caption text-ink-subtle">
          Cene so z DDV. Darilo lahko pošljemo po pošti tudi na naslov prejemnika; to izberete na blagajni.
        </p>

        {napaka && (
          <p role="alert" className="type-small font-medium text-danger">
            {napaka}
          </p>
        )}

        {!trgovinaOdprta ? (
          <Obvestilo naslov="Spletna trgovina je trenutno zaprta">
            Naročila ta čas sprejemamo le po telefonu
            {telefon && telefonPovezava && (
              <>
                {" "}
                na{" "}
                <a href={telefonPovezava} className="font-semibold underline underline-offset-4">
                  {telefon}
                </a>
              </>
            )}
            .
          </Obvestilo>
        ) : (
          <div className="flex flex-col gap-2">
            <Button size="lg" block disabled={!lahkoVKosarico} onClick={vKosarico} aria-describedby="darilo-opis">
              {urejanje ? "Shrani spremembe" : "V košarico"}
            </Button>
            <p id="darilo-opis" className="type-small text-ink-muted">
              {!tip
                ? "Izberite škatlo."
                : vsebina.length === 0
                  ? "Dodajte vsaj en izdelek."
                  : prevec
                    ? "V škatli je preveč izdelkov."
                    : prosto > 0
                      ? `Prostih mest: ${prosto}. Škatle ni treba napolniti do konca.`
                      : "Škatla je polna."}
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
