import type { IzdelekPogled } from "@/katalog/podatki";
import { razpolozljivostIzdelka } from "@/katalog/razpolozljivost";
import type { Mesec } from "@/katalog/sezona";
import { KarticaIzdelka } from "./KarticaIzdelka";

/** Koliko sorodnih izdelkov pokažemo (2 vrstici na telefonu, 1 na namizju). */
const NAJVEC = 4;

/**
 * Izbor sorodnih izdelkov za podstran izdelka: najprej naročljivi iz iste
 * kategorije, nato drugi naročljivi (v vrstnem redu iz CMS). Izdelek sam in
 * izdelki, ki jih ta čas ni mogoče naročiti, niso v izboru.
 */
export function sorodniIzdelki(izdelek: IzdelekPogled, vsi: readonly IzdelekPogled[], mesec: Mesec): IzdelekPogled[] {
  const narocljivi = vsi.filter((i) => i.id !== izdelek.id && razpolozljivostIzdelka(i, mesec).narocljiva);
  const istaKategorija = narocljivi.filter((i) => i.kategorija.id === izdelek.kategorija.id);
  const ostali = narocljivi.filter((i) => i.kategorija.id !== izdelek.kategorija.id);
  return [...istaKategorija, ...ostali].slice(0, NAJVEC);
}

export function SorodniIzdelki({
  izdelki,
  mesec,
  trgovinaOdprta,
}: {
  izdelki: readonly IzdelekPogled[];
  mesec: Mesec;
  trgovinaOdprta: boolean;
}) {
  if (izdelki.length === 0) return null;
  return (
    <section aria-labelledby="sorodni-naslov" className="mt-12 flex flex-col gap-6 md:mt-16">
      <h2 id="sorodni-naslov" className="type-h2 text-ink">
        Morda vam bo všeč tudi
      </h2>
      <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {izdelki.map((i) => (
          <li key={i.id}>
            <KarticaIzdelka
              izdelek={i}
              mesec={mesec}
              naslov="h3"
              trgovinaOdprta={trgovinaOdprta}
              sizes="(min-width: 1024px) 17rem, 50vw"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
