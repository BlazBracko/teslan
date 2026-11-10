import type { Metadata } from "next";
import { Kosarica } from "@/components/kosarica/Kosarica";
import { Container } from "@/components/ui/Container";
import { naloziKontakt } from "@/katalog/podatki";
import { metapodatkiStrani } from "@/seo/metapodatki";

export const metadata: Metadata = metapodatkiStrani({
  naslov: "Košarica",
  opis: "Izdelki, ki ste jih izbrali za naročilo na Domačiji Tešlan.",
  pot: "/kosarica",
  // Vsebina je v brskalniku obiskovalca; iskalniki tu nimajo česa najti.
  brezIndeksa: true,
});

/**
 * Košarica (Z20, Z21, T2 korak 2). Vsebino hrani brskalnik, zato se izriše
 * na odjemalcu; cene, zaloga in pravila dostave pridejo s strežnika.
 */
export default async function KosaricaPage() {
  const kontakt = await naloziKontakt();
  return (
    <Container className="flex flex-col gap-8 py-10 md:py-14">
      <h1 className="type-h1 text-ink">Košarica</h1>
      <Kosarica telefon={kontakt.telefon} telefonPovezava={kontakt.telefonPovezava} />
    </Container>
  );
}
