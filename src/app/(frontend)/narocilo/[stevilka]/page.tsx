import config from "@payload-config";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPayload } from "payload";
import { LuCircleCheck, LuMapPin, LuPhone } from "react-icons/lu";
import { IzprazniKosarico } from "@/components/narocilo/IzprazniKosarico";
import { Zneski } from "@/components/narocilo/Zneski";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { naloziKontakt, naloziNastavitve } from "@/katalog/podatki";
import { formatirajCeno } from "@/lib/denar";
import { ponudnikPlacil } from "@/narocila/placila";
import { narociloPogled, OZNAKE_DOSTAVE, OZNAKE_PLACILA, type NarociloPogled } from "@/narocila/pogled";
import { narociloZZetonom, RAZLOG_NEPLACANO, uskladiSPonudnikom } from "@/narocila/potek-placila";
import { OZNAKE_STATUSOV } from "@/narocila/statusi";
import { OBLIKA_STEVILKE } from "@/narocila/stevilka";
import { PARAMETER_PLACILA } from "@/narocila/stripe";
import { metapodatkiStrani } from "@/seo/metapodatki";

/** Vedno sveže stanje naročila (status se spreminja v adminu). */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Pick<Parametri, "params">): Promise<Metadata> {
  return {
    ...metapodatkiStrani({
      naslov: "Vaše naročilo",
      opis: "Stanje vašega naročila na Domačiji Tešlan.",
      // Brez žetona: kanonični URL ne sme razkriti dostopa do naročila.
      pot: `/narocilo/${encodeURIComponent((await params).stevilka)}`,
      brezSledenja: true,
    }),
    // Žeton je v naslovu strani: ne sme oditi drugim stranem kot referer.
    referrer: "no-referrer",
  };
}

type Parametri = {
  params: Promise<{ stevilka: string }>;
  searchParams: Promise<{ k?: string | string[]; [PARAMETER_PLACILA]?: string | string[] }>;
};

/**
 * Naročilo po številki in žetonu (Z32). Brez pravilnega žetona stran vrne
 * 404, ne glede na to, ali naročilo obstaja.
 *
 * Ko se kupec vrne s plačila (`?placilo=1`) in naročilo še čaka na
 * plačilo, se stanje preveri neposredno pri Stripu: kupec takoj vidi
 * plačano naročilo, tudi če dogodek webhooka še ni prispel (obdelava je
 * ista in idempotentna, Z41).
 */
async function najdiNarocilo(
  stevilka: string,
  zeton: string | undefined,
  poPlacilu: boolean,
): Promise<NarociloPogled | null> {
  if (!OBLIKA_STEVILKE.test(stevilka) || !zeton) return null;
  const payload = await getPayload({ config });
  let narocilo = await narociloZZetonom(payload, stevilka, zeton);
  if (!narocilo) return null;
  const ponudnik = ponudnikPlacil();
  if (poPlacilu && ponudnik && narocilo.status === "caka-placilo") {
    try {
      const izid = await uskladiSPonudnikom(payload, ponudnik, narocilo, { prekini: false, razlog: RAZLOG_NEPLACANO });
      if (izid !== "caka" && izid !== "prezrto") narocilo = (await narociloZZetonom(payload, stevilka, zeton)) ?? narocilo;
    } catch (napaka) {
      payload.logger.error({ err: napaka, narocilo: stevilka }, "Stanja plačila ni bilo mogoče preveriti pri Stripu");
    }
  }
  return narociloPogled(narocilo);
}

const oblikaDatuma = new Intl.DateTimeFormat("sl-SI", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Europe/Ljubljana",
});

function Uvod({ n, email }: { n: NarociloPogled; email: string }) {
  switch (n.status) {
    case "preklicano":
      return <>Naročilo je preklicano. Za vprašanja nas pokličite.</>;
    case "zakljuceno":
      return <>Naročilo je zaključeno. Hvala, ker ste izbrali domače.</>;
    case "pripravljeno":
      return <>Naročilo je pripravljeno za prevzem na kmetiji.</>;
    case "poslano":
      return <>Naročilo je na poti k vam.</>;
    case "caka-placilo":
      return <>Plačila s kartico še nismo prejeli. Če ste plačali, bo potrjeno v nekaj trenutkih; osvežite stran.</>;
    default:
      return (
        <>
          Prejeli smo ga in ga pripravljamo. Potrdilo smo poslali na <strong className="text-ink">{email}</strong>.
          {n.nacinDostave === "prevzem"
            ? " Ko bo pripravljeno za prevzem, vas obvestimo."
            : " Ko bo poslano, vas obvestimo."}
        </>
      );
  }
}

export default async function NarociloPage({ params, searchParams }: Parametri) {
  const [{ stevilka }, iskanje] = await Promise.all([params, searchParams]);
  const { k } = iskanje;
  const poPlacilu = iskanje[PARAMETER_PLACILA] === "1";
  const n = await najdiNarocilo(decodeURIComponent(stevilka), typeof k === "string" ? k : undefined, poPlacilu);
  if (!n) notFound();

  const [nastavitve, kontakt] = await Promise.all([naloziNastavitve(), naloziKontakt()]);
  const novo = n.status === "novo" || n.status === "caka-placilo";

  return (
    <Container size="prose" className="flex flex-col gap-10 py-10 md:py-14">
      {poPlacilu && n.status !== "preklicano" && <IzprazniKosarico />}
      <header className="flex flex-col gap-4">
        {novo && (
          <p className="flex items-center gap-2 type-small font-semibold text-success">
            <LuCircleCheck aria-hidden="true" className="size-5" />
            Naročilo je oddano
          </p>
        )}
        <h1 className="type-h1 text-ink">{novo ? "Hvala za vaše naročilo" : `Naročilo ${n.stevilka}`}</h1>
        <p className="type-body-lg text-ink-muted">
          <Uvod n={n} email={n.kupec.email} />
        </p>
        <dl className="grid gap-x-8 gap-y-3 rounded-xl bg-surface p-5 ring-1 ring-line sm:grid-cols-2">
          <div className="flex flex-col gap-0.5">
            <dt className="type-caption text-ink-subtle">Številka naročila</dt>
            <dd className="type-title text-ink" data-testid="stevilka-narocila">
              {n.stevilka}
            </dd>
          </div>
          <div className="flex flex-col items-start gap-1">
            <dt className="type-caption text-ink-subtle">Status</dt>
            <dd>
              <Badge variant={n.status === "preklicano" ? "danger" : n.status === "zakljuceno" ? "neutral" : "brand"}>
                {OZNAKE_STATUSOV[n.status]}
              </Badge>
            </dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="type-caption text-ink-subtle">Oddano</dt>
            <dd className="type-small text-ink">{oblikaDatuma.format(new Date(n.oddano))}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="type-caption text-ink-subtle">Plačilo</dt>
            <dd className="type-small text-ink">
              {OZNAKE_PLACILA[n.nacinPlacila]}
              {n.placano ? " (plačano)" : n.nacinPlacila === "ob-prevzemu" ? `: ${formatirajCeno(n.skupajCenti)}` : ""}
            </dd>
          </div>
        </dl>
      </header>

      <section aria-labelledby="postavke" className="flex flex-col gap-5">
        <h2 id="postavke" className="type-h3 text-ink">
          Naročeno
        </h2>
        <ul className="flex flex-col divide-y divide-line border-y border-line">
          {n.postavke.map((p, i) => (
            <li key={i} className="flex items-baseline justify-between gap-4 py-3">
              <span className="min-w-0 type-body text-ink">
                {p.ime}
                {p.velikost && <span className="text-ink-muted">, {p.velikost}</span>}
                <span className="block type-small text-ink-muted">
                  {p.kolicina} × {formatirajCeno(p.cenaCenti)}
                </span>
                {p.vsebina.length > 0 && (
                  <span className="mt-1 block type-small text-ink-muted">
                    V škatli: {p.vsebina.map((v) => `${v.kolicina} × ${v.ime}${v.velikost ? `, ${v.velikost}` : ""}`).join("; ")}
                  </span>
                )}
                {p.sporociloNaKartici && (
                  <span className="mt-1 block type-small text-ink-muted">
                    <span className="font-medium text-ink">Sporočilo na kartici:</span> „{p.sporociloNaKartici}“
                  </span>
                )}
              </span>
              <span className="shrink-0 type-body type-numeric text-ink">{formatirajCeno(p.skupajCenti)}</span>
            </li>
          ))}
        </ul>
        <Zneski
          vmesniSestevekCenti={n.vmesniSestevekCenti}
          postninaCenti={n.postninaCenti}
          skupajCenti={n.skupajCenti}
          ddv={n.ddv}
          posta={n.nacinDostave === "posta"}
        />
        <p className="type-small text-ink-muted">To ni račun.</p>
      </section>

      <section aria-labelledby="dostava" className="flex flex-col gap-4">
        <h2 id="dostava" className="type-h3 text-ink">
          {OZNAKE_DOSTAVE[n.nacinDostave]}
        </h2>
        {n.naslov ? (
          <p className="type-body text-ink">
            {n.darilo && (
              <span className="mb-1 block type-small font-semibold text-ink-muted">Darilo na naslov prejemnika:</span>
            )}
            {n.darilo && n.prejemnik ? n.prejemnik.ime : `${n.kupec.ime} ${n.kupec.priimek}`}
            <br />
            {n.naslov.ulica}
            <br />
            {n.naslov.postnaStevilka} {n.naslov.kraj}
          </p>
        ) : (
          <div className="flex flex-col gap-3 type-body text-ink">
            {nastavitve.navodilaZaPrevzem?.trim() && (
              <p className="whitespace-pre-line">{nastavitve.navodilaZaPrevzem.trim()}</p>
            )}
            {kontakt.naslov && (
              <p className="flex items-start gap-2">
                <LuMapPin aria-hidden="true" className="mt-1 size-4 shrink-0 text-ink-muted" />
                <span>
                  {kontakt.naslov}
                  {kontakt.pot && (
                    <>
                      {" · "}
                      <a href={kontakt.pot} className="underline underline-offset-4" target="_blank" rel="noreferrer">
                        Pot do kmetije
                      </a>
                    </>
                  )}
                </span>
              </p>
            )}
            {kontakt.telefon && kontakt.telefonPovezava && (
              <p className="flex items-center gap-2">
                <LuPhone aria-hidden="true" className="size-4 shrink-0 text-ink-muted" />
                <a href={kontakt.telefonPovezava} className="underline underline-offset-4">
                  {kontakt.telefon}
                </a>
              </p>
            )}
          </div>
        )}
        {n.opomba && (
          <p className="type-small text-ink-muted">
            <span className="font-medium text-ink">Vaša opomba:</span> {n.opomba}
          </p>
        )}
      </section>

      <div>
        <Button asChild variant="secondary">
          <Link href="/products">Nazaj na izdelke</Link>
        </Button>
      </div>
    </Container>
  );
}
