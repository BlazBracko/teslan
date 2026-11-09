import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { naloziKontakt } from "@/katalog/podatki";

export const metadata: Metadata = {
  title: "Politika zasebnosti — Domačija Tešlan",
  description: "Kako Domačija Tešlan zbira, uporablja in varuje vaše osebne podatke.",
};

/** Podatki upravljavca so iz nastavitev trgovine (baza). */
export const dynamic = "force-dynamic";

const povezava = "rounded-xs font-medium text-brand underline underline-offset-4";

function Poglavje({ naslov, children }: { naslov: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="type-h3 text-ink">{naslov}</h2>
      <div className="flex flex-col gap-3 type-body text-ink-muted">{children}</div>
    </section>
  );
}

/**
 * Politika zasebnosti z obstoječo vsebino na novem UI (Z5). Posodobljeno
 * besedilo za trgovino (obdelovalci, košarica v brskalniku, Z60/Z61) doda
 * K11.
 */
export default async function PrivacyPolicyPage() {
  const kontakt = await naloziKontakt();
  const eposta = kontakt.email ? (
    <a href={`mailto:${kontakt.email}`} className={povezava}>
      {kontakt.email}
    </a>
  ) : null;

  return (
    <>
      <PageHeader
        label="Pravni dokumenti"
        title="Politika zasebnosti"
        description="Kako zbiramo, uporabljamo in varujemo vaše osebne podatke."
      />

      <Container size="prose" className="flex flex-col gap-10 py-12 md:py-16">
        <p className="type-body-lg text-ink-muted">
          Ta pravilnik o zasebnosti opisuje, kako {kontakt.ime} (v nadaljevanju: »mi«) zbira, uporablja in varuje
          vaše osebne podatke, ko uporabljate našo spletno stran in stopite v stik z nami.
        </p>

        <Poglavje naslov="1. Upravljavec osebnih podatkov">
          <p>Upravljavec vaših osebnih podatkov je:</p>
          <address className="flex flex-col gap-1 rounded-lg bg-surface p-5 not-italic ring-1 ring-line">
            <span className="font-semibold text-ink">{kontakt.ime}</span>
            {kontakt.naslov && <span>{kontakt.naslov}</span>}
            {eposta && <span>E-pošta: {eposta}</span>}
            {kontakt.telefon && kontakt.telefonPovezava && (
              <span>
                Telefon:{" "}
                <a href={kontakt.telefonPovezava} className={povezava}>
                  {kontakt.telefon}
                </a>
              </span>
            )}
          </address>
        </Poglavje>

        <Poglavje naslov="2. Katere podatke zbiramo?">
          <p>Zbiramo le osebne podatke, ki nam jih posredujete preko kontaktnega obrazca:</p>
          <ul className="list-disc pl-5">
            <li>ime in priimek,</li>
            <li>e-poštni naslov,</li>
            <li>vsebina vašega sporočila.</li>
          </ul>
        </Poglavje>

        <Poglavje naslov="3. Namen zbiranja podatkov">
          <p>Vaše podatke uporabljamo izključno za odgovor na vaše povpraševanje ali sporočilo.</p>
        </Poglavje>

        <Poglavje naslov="4. Kako dolgo hranimo vaše podatke?">
          <p>
            Vaše osebne podatke hranimo le toliko časa, kot je potrebno za odgovor na vaše sporočilo, nato jih
            izbrišemo.
          </p>
        </Poglavje>

        <Poglavje naslov="5. Kako varujemo vaše podatke?">
          <p>
            Uporabljamo ustrezne varnostne ukrepe za zaščito vaših osebnih podatkov pred nepooblaščenim dostopom,
            razkritjem ali izgubo.
          </p>
        </Poglavje>

        <Poglavje naslov="6. Pravice uporabnikov">
          <p>V skladu z GDPR imate pravico do:</p>
          <ul className="list-disc pl-5">
            <li>dostopa do svojih podatkov,</li>
            <li>popravka napačnih podatkov,</li>
            <li>izbrisa svojih podatkov,</li>
            <li>omejitve obdelave,</li>
            <li>ugovora obdelavi.</li>
          </ul>
          <p>Če želite uveljavljati katero koli od teh pravic, nas kontaktirajte{eposta && <> na {eposta}</>}.</p>
        </Poglavje>

        <Poglavje naslov="7. Spremembe pravilnika">
          <p>Ta pravilnik se lahko občasno posodobi.</p>
          <p className="type-small text-ink-subtle">Zadnja posodobitev: april 2025</p>
        </Poglavje>
      </Container>
    </>
  );
}
