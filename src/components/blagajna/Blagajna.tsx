"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LuCircleAlert, LuInfo, LuRefreshCw, LuShoppingBag } from "react-icons/lu";
import { Zneski } from "@/components/narocilo/Zneski";
import { POT_KOSARICE, POT_POGOJEV, POT_ZASEBNOSTI } from "@/components/postavitev/navigacija";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field } from "@/components/ui/Field";
import { Input, Textarea } from "@/components/ui/Input";
import { RadioCard, RadioGroup } from "@/components/ui/RadioGroup";
import { Skeleton } from "@/components/ui/Skeleton";
import { preveriKosaricoNaStrezniku } from "@/kosarica/akcije";
import { izracunajZnesek, type NacinDostave, type NacinPlacila } from "@/kosarica/cene";
import { dovoljenaPlacila, nastevanje } from "@/kosarica/dostava";
import type { PostavkaKosarice } from "@/kosarica/postavke";
import type { PregledKosarice } from "@/kosarica/preverjanje";
import { izprazniKosarico, useKosarica } from "@/kosarica/shramba";
import { formatirajCeno } from "@/lib/denar";
import { oddajNarociloNaStrezniku } from "@/narocila/akcije";
import { IME_PASTI, NAJDALJSA_OPOMBA, preveriBlagajno, type NapakeBlagajne, type PoljeBlagajne } from "@/narocila/obrazec";
import type { TezavaOddaje } from "@/narocila/oddaja";
import { OZNAKE_PLACILA } from "@/narocila/pogled";

/**
 * Blagajna (Z22–Z27, T2 korak 3, T3 korak 2, T4). Košarica je v
 * brskalniku; cene, zalogo in pravila dostave izračuna strežnik. Obrazec
 * se preveri v brskalniku in še enkrat na strežniku z isto shemo. Ob
 * uspehu se košarica izprazni in kupec gre na potrdilo naročila.
 *
 * Nakupni tok je brez okrasnih animacij (Z2).
 */

/** Vrstni red polj za premik fokusa na prvo napako. */
const VRSTNI_RED_POLJ: PoljeBlagajne[] = [
  "ime",
  "priimek",
  "email",
  "telefon",
  "nacinDostave",
  "ulica",
  "postnaStevilka",
  "kraj",
  "nacinPlacila",
  "opomba",
  "soglasje",
];

const idPolja = (polje: PoljeBlagajne) => `blagajna-${polje}`;

type Napaka =
  | { vrsta: "obrazec"; sporocilo: string }
  | { vrsta: "kosarica"; sporocilo: string; tezave: TezavaOddaje[] }
  | { vrsta: "zavrnjeno"; sporocilo: string };

export interface BlagajnaProps {
  trgovinaOdprta: boolean;
  kartica: boolean;
  navodilaZaPrevzem: string | null;
  naslovKmetije: string | null;
  telefon: string | null;
  telefonPovezava: string | null;
}

export function Blagajna(props: BlagajnaProps) {
  const kosarica = useKosarica();
  const [rezultat, setRezultat] = useState<{ za: PostavkaKosarice[]; pregled: PregledKosarice } | null>(null);
  const [napakaPreverjanja, setNapakaPreverjanja] = useState<PostavkaKosarice[] | null>(null);
  const [poskus, setPoskus] = useState(0);
  const [oddano, setOddano] = useState(false);

  useEffect(() => {
    if (!kosarica || kosarica.length === 0 || oddano) return;
    let preklicano = false;
    preveriKosaricoNaStrezniku(kosarica).then(
      (pregled) => {
        if (preklicano) return;
        setRezultat({ za: kosarica, pregled });
        setNapakaPreverjanja(null);
      },
      () => {
        if (!preklicano) setNapakaPreverjanja(kosarica);
      },
    );
    return () => {
      preklicano = true;
    };
  }, [kosarica, poskus, oddano]);

  if (oddano) {
    return (
      <p role="status" className="type-body text-ink-muted">
        Naročilo je oddano. Odpiram potrdilo …
      </p>
    );
  }

  if (kosarica === null) return <Nalaganje />;

  if (kosarica.length === 0) {
    return (
      <EmptyState
        icon={<LuShoppingBag aria-hidden="true" />}
        title="Vaša košarica je prazna"
        description="Za naročilo najprej dodajte izdelke v košarico."
        action={
          <Button asChild>
            <Link href="/products">Na izdelke</Link>
          </Button>
        }
      />
    );
  }

  if (napakaPreverjanja === kosarica) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3 rounded-lg bg-danger-soft p-5 text-danger">
        <p className="flex items-center gap-2 type-body font-semibold">
          <LuCircleAlert aria-hidden="true" className="size-5" />
          Košarice ta hip ni mogoče preveriti
        </p>
        <p className="type-small">Vaši izdelki so še vedno shranjeni. Poskusite znova čez nekaj trenutkov.</p>
        <Button variant="secondary" size="sm" onClick={() => setPoskus((p) => p + 1)}>
          <LuRefreshCw aria-hidden="true" />
          Poskusi znova
        </Button>
      </div>
    );
  }

  if (!rezultat) return <Nalaganje />;
  const { pregled } = rezultat;

  if (!pregled.trgovinaOdprta || !props.trgovinaOdprta) {
    return (
      <Obvestilo naslov="Spletna trgovina je trenutno zaprta">
        Naročila ta čas sprejemamo le po telefonu
        {props.telefon && props.telefonPovezava && (
          <>
            {" "}
            na{" "}
            <a href={props.telefonPovezava} className="font-semibold underline underline-offset-4">
              {props.telefon}
            </a>
          </>
        )}
        . Košarica ostane shranjena.
      </Obvestilo>
    );
  }

  if (!pregled.lahkoNaBlagajno) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3 rounded-lg bg-warning-soft p-5 text-warning">
        <p className="flex items-center gap-2 type-body font-semibold">
          <LuCircleAlert aria-hidden="true" className="size-5" />
          Nekaterih izdelkov ni mogoče naročiti, kot so v košarici
        </p>
        <p className="type-small">V košarici preberite razlog pri označenih postavkah ter jih odstranite ali popravite.</p>
        <Button asChild variant="secondary" size="sm">
          <Link href={POT_KOSARICE}>Nazaj v košarico</Link>
        </Button>
      </div>
    );
  }

  return (
    <ObrazecBlagajne
      {...props}
      kosarica={kosarica}
      pregled={pregled}
      obOddaji={() => setOddano(true)}
    />
  );
}

function Nalaganje() {
  return (
    <div aria-busy="true" className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <p className="sr-only" role="status">
        Nalagam blagajno …
      </p>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-2/3" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

function Obvestilo({ naslov, children }: { naslov: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-lg bg-info-soft p-4 type-small text-info">
      <LuInfo aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <div className="flex flex-col gap-1">
        <p className="font-semibold">{naslov}</p>
        <p>{children}</p>
      </div>
    </div>
  );
}

function Sekcija({ naslov, children }: { naslov: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-5 border-t border-line pt-6 first:border-t-0 first:pt-0">
      <h2 className="type-h3 text-ink">{naslov}</h2>
      {children}
    </section>
  );
}

function ObrazecBlagajne({
  kosarica,
  pregled,
  kartica,
  navodilaZaPrevzem,
  naslovKmetije,
  obOddaji,
}: BlagajnaProps & {
  kosarica: PostavkaKosarice[];
  pregled: PregledKosarice;
  obOddaji: () => void;
}) {
  const router = useRouter();
  const povzetekNapakRef = useRef<HTMLDivElement>(null);
  const [nacinDostave, setNacinDostave] = useState<NacinDostave>("prevzem");
  const [izbranoPlacilo, setIzbranoPlacilo] = useState<NacinPlacila | undefined>(kartica ? undefined : "ob-prevzemu");
  const [soglasje, setSoglasje] = useState(false);
  const [napake, setNapake] = useState<NapakeBlagajne>({});
  const [napaka, setNapaka] = useState<Napaka | null>(null);
  const [posiljam, setPosiljam] = useState(false);

  const { dostava } = pregled;
  const posta = nacinDostave === "posta";
  const placila = dovoljenaPlacila(nacinDostave);
  // Pri pošti je plačilo samo s kartico (Z22); izbira ob prevzemu tedaj ne velja.
  const nacinPlacila = izbranoPlacilo && placila.includes(izbranoPlacilo) ? izbranoPlacilo : undefined;
  const karticaEdina = posta && !kartica;

  const znesek = izracunajZnesek(
    pregled.postavke
      .filter((p) => p.tezava === null && p.cenaCenti != null && p.stopnjaDDV != null)
      .map((p) => ({ cenaCenti: p.cenaCenti as number, stopnjaDDV: p.stopnjaDDV as number, kolicina: p.kolicina })),
    nacinDostave,
    { postninaCenti: dostava.postninaCenti, pragBrezplacnePostnineCenti: dostava.pragBrezplacnePostnineCenti },
  );

  const polje = (ime: PoljeBlagajne) => ({ id: idPolja(ime), error: napake[ime] });

  function pokaziNapake(nove: NapakeBlagajne) {
    setNapake(nove);
    const prvo = VRSTNI_RED_POLJ.find((p) => nove[p]);
    if (!prvo) return;
    // Fokus na prvo napačno polje (v skupini izbirnih gumbov na izbrani ali prvi gumb).
    requestAnimationFrame(() => {
      const el = document.getElementById(idPolja(prvo));
      const cilj =
        el?.getAttribute("role") === "radiogroup"
          ? (el.querySelector<HTMLElement>('[data-state="checked"]') ?? el.querySelector<HTMLElement>("button:not([disabled])"))
          : el;
      cilj?.focus();
    });
  }

  async function oddaj(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (posiljam) return;
    const podatki = new FormData(e.currentTarget);
    const besedilo = (ime: string) => {
      const v = podatki.get(ime);
      return typeof v === "string" ? v : "";
    };
    const obrazec = {
      ime: besedilo("ime"),
      priimek: besedilo("priimek"),
      email: besedilo("email"),
      telefon: besedilo("telefon"),
      nacinDostave,
      nacinPlacila,
      ...(posta ? { ulica: besedilo("ulica"), postnaStevilka: besedilo("postnaStevilka"), kraj: besedilo("kraj") } : {}),
      opomba: besedilo("opomba"),
      soglasje: soglasje || undefined,
    };

    setNapaka(null);
    const preverjeno = preveriBlagajno(obrazec);
    if (!preverjeno.success) {
      pokaziNapake(preverjeno.napake);
      return;
    }
    setNapake({});
    setPosiljam(true);
    try {
      const r = await oddajNarociloNaStrezniku({ obrazec, kosarica, [IME_PASTI]: besedilo(IME_PASTI) });
      if (r.ok) {
        obOddaji();
        izprazniKosarico();
        router.replace(r.pot);
        return;
      }
      if (r.vrsta === "obrazec") {
        setNapaka({ vrsta: "obrazec", sporocilo: r.sporocilo });
        pokaziNapake(r.napake);
      } else {
        // Seznam težav ostane viden ob obrazcu; košarica se ponovno preveri
        // šele, ko jo kupec uredi.
        setNapaka(r);
        requestAnimationFrame(() => povzetekNapakRef.current?.focus());
      }
    } catch {
      setNapaka({
        vrsta: "zavrnjeno",
        sporocilo: "Naročila ta hip ni bilo mogoče oddati. Preverite povezavo in poskusite znova.",
      });
      requestAnimationFrame(() => povzetekNapakRef.current?.focus());
    } finally {
      setPosiljam(false);
    }
  }

  const steviloNapak = Object.keys(napake).length;

  return (
    <form
      noValidate
      onSubmit={oddaj}
      aria-label="Podatki za naročilo"
      className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12"
    >
      <div className="flex min-w-0 flex-col gap-8">
        {(napaka || steviloNapak > 0) && (
          <div
            ref={povzetekNapakRef}
            tabIndex={-1}
            role="alert"
            className="flex flex-col gap-2 rounded-lg bg-danger-soft p-4 type-small text-danger focus-visible:outline-2 focus-visible:outline-focus"
          >
            <p className="flex items-center gap-2 font-semibold">
              <LuCircleAlert aria-hidden="true" className="size-5 shrink-0" />
              {napaka?.sporocilo ?? "Preverite označena polja."}
            </p>
            {napaka?.vrsta === "kosarica" && (
              <>
                <ul className="list-disc pl-11">
                  {napaka.tezave.map((t) => (
                    <li key={`${t.ime}-${t.razlog}`}>
                      <span className="font-medium">{t.ime}:</span> {t.razlog}
                    </li>
                  ))}
                </ul>
                <p className="pl-7">
                  <Link href={POT_KOSARICE} className="font-semibold underline underline-offset-4">
                    Uredite košarico
                  </Link>
                </p>
              </>
            )}
          </div>
        )}

        <Sekcija naslov="Kontaktni podatki">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Ime" required {...polje("ime")}>
              <Input name="ime" autoComplete="given-name" maxLength={100} />
            </Field>
            <Field label="Priimek" required {...polje("priimek")}>
              <Input name="priimek" autoComplete="family-name" maxLength={100} />
            </Field>
            <Field
              label="E-pošta"
              required
              description="Sem pošljemo potrdilo naročila."
              {...polje("email")}
            >
              <Input name="email" type="email" autoComplete="email" inputMode="email" maxLength={200} />
            </Field>
            <Field label="Telefon" required description="Za dogovor o prevzemu ali dostavi." {...polje("telefon")}>
              <Input name="telefon" type="tel" autoComplete="tel" maxLength={20} />
            </Field>
          </div>
        </Sekcija>

        <Sekcija naslov="Dostava">
          <Field label="Način dostave" group required {...polje("nacinDostave")}>
            <RadioGroup
              id={idPolja("nacinDostave")}
              value={nacinDostave}
              onValueChange={(v) => setNacinDostave(v as NacinDostave)}
            >
              <RadioCard
                value="prevzem"
                title="Prevzem na kmetiji"
                description={naslovKmetije ? `${naslovKmetije}. Termin se dogovorimo po telefonu.` : "Termin se dogovorimo po telefonu."}
                aside="brezplačno"
              />
              <RadioCard
                value="posta"
                disabled={!dostava.postaDovoljena}
                title="Pošta"
                description={
                  dostava.postaDovoljena
                    ? dostava.postninaCenti === 0
                      ? "Pošljemo po pošti, poštnina je brezplačna."
                      : `Brezplačno od ${formatirajCeno(dostava.pragBrezplacnePostnineCenti)}. Plačilo samo s kartico.`
                    : `Ni mogoče, ker so v košarici izdelki samo za prevzem na kmetiji: ${nastevanje(dostava.samoPrevzem)}.`
                }
                aside={dostava.postaDovoljena ? (dostava.postninaCenti === 0 ? "brezplačno" : formatirajCeno(dostava.postninaCenti)) : undefined}
              />
            </RadioGroup>
          </Field>

          {posta ? (
            <div className="grid gap-5 sm:grid-cols-[8rem_minmax(0,1fr)]">
              <Field label="Ulica in hišna številka" required className="sm:col-span-2" {...polje("ulica")}>
                <Input name="ulica" autoComplete="shipping street-address" maxLength={200} />
              </Field>
              <Field label="Poštna številka" required {...polje("postnaStevilka")}>
                <Input
                  name="postnaStevilka"
                  autoComplete="shipping postal-code"
                  inputMode="numeric"
                  maxLength={4}
                  pattern="[0-9]{4}"
                />
              </Field>
              <Field label="Kraj" required {...polje("kraj")}>
                <Input name="kraj" autoComplete="shipping address-level2" maxLength={100} />
              </Field>
              <p className="type-caption text-ink-subtle sm:col-span-2">Pošiljamo samo po Sloveniji.</p>
            </div>
          ) : (
            navodilaZaPrevzem && <p className="type-small whitespace-pre-line text-ink-muted">{navodilaZaPrevzem}</p>
          )}
        </Sekcija>

        <Sekcija naslov="Plačilo">
          <Field
            label="Način plačila"
            group
            required
            description={posta ? "Pri pošiljanju po pošti je mogoče plačati samo s kartico." : undefined}
            {...polje("nacinPlacila")}
          >
            <RadioGroup
              id={idPolja("nacinPlacila")}
              value={nacinPlacila ?? ""}
              onValueChange={(v) => setIzbranoPlacilo(v as NacinPlacila)}
            >
              {placila.map((p) => (
                <RadioCard
                  key={p}
                  value={p}
                  disabled={p === "kartica" && !kartica}
                  title={OZNAKE_PLACILA[p]}
                  description={
                    p === "kartica"
                      ? kartica
                        ? "Varno plačilo s kartico, Apple Pay ali Google Pay."
                        : "Plačilo s kartico bo na voljo v kratkem."
                      : "Plačate ob prevzemu na kmetiji."
                  }
                />
              ))}
            </RadioGroup>
          </Field>
          {karticaEdina && (
            <Obvestilo naslov="Pošiljanje po pošti ta čas ni mogoče">
              Pošiljke plačate s kartico, ki pa trenutno ni na voljo. Izberite prevzem na kmetiji ali nas pokličite.
            </Obvestilo>
          )}
        </Sekcija>

        <Sekcija naslov="Opomba">
          <Field
            label="Opomba k naročilu"
            description={`Neobvezno, npr. želeni termin prevzema. Največ ${NAJDALJSA_OPOMBA} znakov.`}
            {...polje("opomba")}
          >
            <Textarea name="opomba" rows={3} maxLength={NAJDALJSA_OPOMBA} />
          </Field>
        </Sekcija>

        {/* Past za robote (Z26): človek polja ne vidi in ga ne izpolni. */}
        <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
          <label htmlFor={IME_PASTI}>Spletna stran (pustite prazno)</label>
          <input id={IME_PASTI} name={IME_PASTI} type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
        </div>
      </div>

      <aside
        aria-labelledby="povzetek-narocila"
        className="flex flex-col gap-5 rounded-xl bg-surface p-6 shadow-raised ring-1 ring-line lg:sticky lg:top-24"
      >
        <h2 id="povzetek-narocila" className="type-h3 text-ink">
          Vaše naročilo
        </h2>
        <ul className="flex flex-col gap-2 type-small">
          {pregled.postavke.map((p) => (
            <li key={p.kljuc} className="flex items-baseline justify-between gap-4">
              <span className="min-w-0 text-ink">
                {p.izdelek?.ime}
                {p.velikost && <span className="text-ink-muted">, {p.velikost}</span>}
                <span className="text-ink-muted"> × {p.kolicina}</span>
              </span>
              {p.skupajCenti != null && <span className="shrink-0 type-numeric text-ink">{formatirajCeno(p.skupajCenti)}</span>}
            </li>
          ))}
        </ul>
        <div className="border-t border-line pt-5">
          <Zneski
            vmesniSestevekCenti={znesek.vmesniSestevekCenti}
            postninaCenti={znesek.postninaCenti}
            skupajCenti={znesek.skupajCenti}
            ddv={znesek.ddv}
            posta={posta}
          />
        </div>

        <div className="flex flex-col gap-4 border-t border-line pt-5">
          <Checkbox
            id={idPolja("soglasje")}
            checked={soglasje}
            onCheckedChange={(v) => setSoglasje(v === true)}
            aria-required="true"
            error={napake.soglasje}
            label={
              <>
                Strinjam se s{" "}
                <Link href={POT_POGOJEV} target="_blank" className="font-medium underline underline-offset-4">
                  splošnimi pogoji poslovanja
                </Link>
                .<span aria-hidden="true" className="text-danger"> *</span>
              </>
            }
            description={
              <>
                Vaše podatke uporabimo samo za izvedbo naročila, gl.{" "}
                <Link href={POT_ZASEBNOSTI} target="_blank" className="underline underline-offset-4">
                  politiko zasebnosti
                </Link>
                .
              </>
            }
          />
          <Button type="submit" size="lg" block loading={posiljam} disabled={karticaEdina}>
            Oddaj naročilo
          </Button>
          <p className="type-caption text-ink-subtle">
            Z oddajo se zavežete k plačilu. Potrdilo dobite na e-pošto; to ni račun.
          </p>
        </div>
      </aside>
    </form>
  );
}
