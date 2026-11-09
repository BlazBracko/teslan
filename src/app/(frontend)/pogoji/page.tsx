import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { naloziKontakt } from "@/katalog/podatki";

export const metadata: Metadata = {
  title: "Splošni pogoji poslovanja — Domačija Tešlan",
  description: "Splošni pogoji spletne trgovine Domačije Tešlan.",
};

/**
 * Začasni splošni pogoji (K7): blagajna zahteva potrditev pogojev s
 * povezavo (Z25). Celotno besedilo po ZVPot-1 doda K11 (Z61).
 */
export default async function PogojiPage() {
  const kontakt = await naloziKontakt();
  return (
    <Container size="prose" className="flex flex-col gap-6 py-10 md:py-14">
      <h1 className="type-h1 text-ink">Splošni pogoji poslovanja</h1>
      <p className="rounded-lg bg-warning-soft p-4 type-small text-warning">
        Osnutek – v pripravi. Celotno besedilo splošnih pogojev bo objavljeno v kratkem.
      </p>
      <div className="flex flex-col gap-4 type-body text-ink">
        <p>
          Prodajalec je {kontakt.ime}
          {kontakt.naslov && <>, {kontakt.naslov}</>}. Cene so v evrih in vključujejo DDV. Naročilo je oddano, ko
          ga potrdite na blagajni; potrdilo prejmete po e-pošti. Potrdilo naročila ni račun.
        </p>
        <p>
          Izdelke lahko prevzamete na kmetiji ali jih (kjer je to mogoče) prejmete po pošti v Sloveniji. Pri prevzemu
          plačate ob prevzemu, pri pošiljanju s kartico.
        </p>
        <p>
          Za vprašanja o naročilu nas pokličite
          {kontakt.telefon && kontakt.telefonPovezava && (
            <>
              {" "}
              na{" "}
              <a href={kontakt.telefonPovezava} className="font-medium underline underline-offset-4">
                {kontakt.telefon}
              </a>
            </>
          )}
          {kontakt.email && (
            <>
              {" "}
              ali pišite na{" "}
              <a href={`mailto:${kontakt.email}`} className="font-medium underline underline-offset-4">
                {kontakt.email}
              </a>
            </>
          )}
          .
        </p>
      </div>
    </Container>
  );
}
