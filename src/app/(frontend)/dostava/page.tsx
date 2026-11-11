import type { Metadata } from "next";
import Link from "next/link";
import type { IconType } from "react-icons";
import {
  LuBanknote,
  LuCheck,
  LuCreditCard,
  LuGift,
  LuInfo,
  LuNavigation,
  LuPackage,
  LuPackageCheck,
  LuRotateCcw,
  LuStore,
  LuTruck,
} from "react-icons/lu";
import { potIzdelka } from "@/components/katalog/KarticaIzdelka";
import { POT_DARIL, POT_ODSTOPA, POT_POGOJEV, POT_VPRASANJ } from "@/components/postavitev/navigacija";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { OznakaOsnutka } from "@/components/vsebina/OznakaOsnutka";
import { POT_TRGOVINE } from "@/katalog/nakup";
import { naloziKatalog, naloziKontakt, naloziNastavitve } from "@/katalog/podatki";
import { formatirajCeno } from "@/lib/denar";
import { cn } from "@/lib/utils";
import { karticaNaVoljo } from "@/narocila/placila";
import { metapodatkiStrani } from "@/seo/metapodatki";

export const metadata: Metadata = metapodatkiStrani({
  naslov: "Dostava in plačilo",
  opis: "Kako do izdelkov Domačije Tešlan: pošiljanje po pošti po Sloveniji, brezplačen prevzem na kmetiji v Podgori, poštnina in načini plačila.",
  pot: "/dostava",
});

/** Poštnina, prag, navodila za prevzem in kontakt so iz nastavitev trgovine. */
export const dynamic = "force-dynamic";

const povezava = "rounded-xs font-medium text-brand underline underline-offset-4";

function Nacin({
  ikona: Ikona,
  naslov,
  cena,
  pripis,
  tocke,
  children,
}: {
  ikona: IconType;
  naslov: string;
  cena: string;
  pripis: string;
  tocke: React.ReactNode[];
  children?: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5 rounded-2xl bg-surface p-5 shadow-raised ring-1 ring-line sm:p-8">
      <div className="flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
          <Ikona aria-hidden="true" className="size-6" />
        </span>
        <div className="flex flex-col gap-1">
          <h2 className="type-h3 text-ink">{naslov}</h2>
          <p className="type-body text-ink-muted">
            <span className="type-numeric font-semibold text-ink">{cena}</span> · {pripis}
          </p>
        </div>
      </div>
      <ul className="flex flex-col gap-2.5 type-body text-ink-muted">
        {tocke.map((t, i) => (
          <li key={i} className="flex gap-3">
            <LuCheck aria-hidden="true" className="mt-1 size-4.5 shrink-0 text-success" />
            <span>{t}</span>
          </li>
        ))}
      </ul>
      {children}
    </section>
  );
}

function Odsek({
  id,
  ikona: Ikona,
  naslov,
  children,
}: {
  id: string;
  ikona: IconType;
  naslov: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-naslov`} className="grid gap-4 border-t border-line pt-8 md:grid-cols-[16rem_minmax(0,1fr)] md:gap-10">
      <h2 id={`${id}-naslov`} className="flex items-center gap-3 self-start type-h3 text-ink">
        <Ikona aria-hidden="true" className="size-6 shrink-0 text-brand" />
        {naslov}
      </h2>
      <div className="flex max-w-prose flex-col gap-3 type-body text-ink-muted">{children}</div>
    </section>
  );
}

/**
 * Dostava in plačilo: vse, kar kupec sicer izve šele na blagajni. Zneski,
 * navodila za prevzem in kontakt pridejo iz nastavitev trgovine, seznam
 * izdelkov samo za prevzem iz kataloga; ostalo besedilo je osnutek.
 */
export default async function DostavaPage() {
  const [nastavitve, kontakt, katalog] = await Promise.all([naloziNastavitve(), naloziKontakt(), naloziKatalog()]);
  const kartica = karticaNaVoljo();
  const postnina = formatirajCeno(nastavitve.postninaCenti);
  const prag = formatirajCeno(nastavitve.pragBrezplacnePostnineCenti);
  const samoPrevzem = katalog.izdelki.filter((i) => i.nacinProdaje === "samo-prevzem");
  const navodila = nastavitve.navodilaZaPrevzem?.trim();

  return (
    <>
      <PageHeader
        label="Pomoč pri nakupu"
        title="Dostava in plačilo"
        description="Izdelke pošljemo po pošti ali jih pripravimo za prevzem na kmetiji. Način izberete na blagajni."
      />
      <Container className="flex flex-col gap-10 py-8 md:py-14">
        <OznakaOsnutka>
          Zneski in navodila za prevzem so iz nastavitev trgovine. Preverite roke pošiljanja ter besedili o pakiranju
          in poškodovanih pošiljkah.
        </OznakaOsnutka>

        <div className="grid gap-5 lg:grid-cols-2">
          <Nacin
            ikona={LuTruck}
            naslov="Po pošti"
            cena={postnina}
            pripis={`brezplačno pri naročilu nad ${prag}`}
            tocke={[
              "Pošiljamo na naslove v Sloveniji.",
              "Paket oddamo na pošto praviloma v nekaj delovnih dneh po prejemu naročila.",
              "Ko paket oddamo, vas obvestimo po e-pošti.",
              "Plačilo s kartico ob naročilu.",
            ]}
          />
          <Nacin
            ikona={LuStore}
            naslov="Prevzem na kmetiji"
            cena="Brezplačno"
            pripis="v Podgori pri Novem mestu"
            tocke={[
              kontakt.naslov && kontakt.zemljevid ? (
                <>
                  Naslov:{" "}
                  <a href={kontakt.zemljevid} target="_blank" rel="noopener noreferrer" className={povezava}>
                    {kontakt.naslov}
                    <span className="sr-only"> (zemljevid se odpre v novem zavihku)</span>
                  </a>
                  .
                </>
              ) : (
                "Na kmetiji v Podgori."
              ),
              "Ko je naročilo pripravljeno, vas obvestimo po e-pošti.",
              "Termin prevzema se dogovorimo po telefonu ali ga zapišete v opombo ob naročilu.",
              "Plačilo s kartico ob naročilu ali ob prevzemu.",
            ]}
          >
            {navodila && <p className="rounded-lg bg-canvas p-4 type-small whitespace-pre-line text-ink-muted">{navodila}</p>}
            {kontakt.pot && (
              <Button asChild variant="secondary" className="self-start">
                <a href={kontakt.pot} target="_blank" rel="noopener noreferrer">
                  <LuNavigation aria-hidden="true" />
                  Navodila za pot
                  <span className="sr-only"> (odpre se v novem zavihku)</span>
                </a>
              </Button>
            )}
          </Nacin>
        </div>

        <Odsek id="samo-prevzem" ikona={LuPackage} naslov="Kaj pošljemo in česa ne">
          <p>
            Po pošti pošljemo vse izdelke z oznako »Pošljemo po pošti« in darilne škatle. Jajca in sveža zelenjava so
            občutljivi, zato jih ne pošiljamo: imajo oznako »Na voljo na kmetiji«.
          </p>
          {samoPrevzem.length > 0 && (
            <p>
              Na spletu jih naročite in prevzamete na kmetiji:{" "}
              {samoPrevzem.map((i, n) => (
                <span key={i.id}>
                  {n > 0 && ", "}
                  <Link href={potIzdelka(i.slug)} className={povezava}>
                    {i.ime}
                  </Link>
                </span>
              ))}
              .
            </p>
          )}
          <p>
            Če je v košarici izdelek, ki je na voljo na kmetiji, celotno naročilo prevzamete na kmetiji. Če želite ostale izdelke
            prejeti po pošti, jih naročite posebej.
          </p>
        </Odsek>

        <Odsek id="placilo" ikona={LuCreditCard} naslov="Plačilo">
          <ul className="flex flex-col gap-4">
            <li className="flex gap-3">
              <LuCreditCard aria-hidden="true" className="mt-1 size-5 shrink-0 text-brand" />
              <span>
                <strong className="font-semibold text-ink">S kartico.</strong> Tudi Apple Pay in Google Pay, na varni
                strani ponudnika plačil Stripe. Podatkov o kartici ne vidimo in ne hranimo. Pri pošiljanju po pošti je
                to edini način plačila.
              </span>
            </li>
            <li className="flex gap-3">
              <LuBanknote aria-hidden="true" className="mt-1 size-5 shrink-0 text-brand" />
              <span>
                <strong className="font-semibold text-ink">Ob prevzemu.</strong> Če naročilo prevzamete na kmetiji, ga
                lahko plačate ob prevzemu.
              </span>
            </li>
          </ul>
          {!kartica && (
            <p className={cn("flex gap-3 rounded-lg bg-info-soft p-4 type-small text-info")}>
              <LuInfo aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
              Plačilo s kartico trenutno ni na voljo, zato ta čas sprejemamo samo naročila s prevzemom na kmetiji in
              plačilom ob prevzemu.
            </p>
          )}
          <p>Vse cene vključujejo DDV. Po oddaji naročila dobite potrdilo na e-pošto.</p>
        </Odsek>

        <Odsek id="darila" ikona={LuGift} naslov="Darila">
          <p>
            Darilno škatlo lahko pošljemo neposredno obdarovancu: na blagajni pri pošiljanju po pošti označite »Pošlji
            na naslov prejemnika«. V paketu ni cen, potrdilo naročila dobite samo vi.
          </p>
          <p>
            <Link href={POT_DARIL} className={povezava}>
              Oglejte si darila
            </Link>
          </p>
        </Odsek>

        <Odsek id="pakiranje" ikona={LuPackageCheck} naslov="Pakiranje in poškodbe">
          <p>
            Steklene kozarce in steklenice skrbno zaščitimo. Če paket kljub temu pride poškodovan, ga fotografirajte in
            nam to čim prej sporočite, da se dogovorimo za zamenjavo ali vračilo kupnine.
          </p>
        </Odsek>

        <Odsek id="vracila" ikona={LuRotateCcw} naslov="Vračila">
          <p>
            Pri nakupu na spletu lahko v 14 dneh odstopite od pogodbe; izjeme so hitro pokvarljiva živila in darilne
            škatle, sestavljene po vaših željah. Podrobnosti so na straneh{" "}
            <Link href={POT_ODSTOPA} className={povezava}>
              Odstop od pogodbe
            </Link>{" "}
            in{" "}
            <Link href={POT_POGOJEV} className={povezava}>
              Splošni pogoji
            </Link>
            .
          </p>
        </Odsek>

        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-8">
          <Button asChild size="lg">
            <Link href={POT_TRGOVINE}>V spletno trgovino</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href={POT_VPRASANJ}>Pogosta vprašanja</Link>
          </Button>
        </div>
      </Container>
    </>
  );
}
