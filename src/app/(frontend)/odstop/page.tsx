import type { Metadata } from "next";
import Link from "next/link";
import { ObrazecZaOdstop } from "@/components/pravno/ObrazecZaOdstop";
import { EpostaProdajalca, Podatek, PodatkiProdajalca, Poglavje, PravnaStran, povezavaBesedila } from "@/components/pravno/PravnaStran";
import { POT_POGOJEV } from "@/components/postavitev/navigacija";
import { naloziPravnePodatke, POSODOBLJENO } from "@/pravno/podatki";
import { obrazecZaOdstop } from "@/pravno/prodajalec";

export const metadata: Metadata = {
  title: "Odstop od pogodbe — Domačija Tešlan",
  description:
    "Pravica do odstopa od pogodbe v 14 dneh, izjeme za živila in darilne škatle ter obrazec za odstop za kopiranje.",
};

/** Podatki prodajalca so iz nastavitev trgovine (baza). */
export const dynamic = "force-dynamic";

const POGLAVJA = [
  { id: "pravica", naslov: "1. Pravica do odstopa" },
  { id: "izjeme", naslov: "2. Kdaj pravica do odstopa ne velja" },
  { id: "kako", naslov: "3. Kako odstopite" },
  { id: "vracilo-blaga", naslov: "4. Vračilo blaga" },
  { id: "vracilo-kupnine", naslov: "5. Vračilo kupnine" },
  { id: "obrazec", naslov: "6. Obrazec za odstop" },
];

/**
 * Odstop od pogodbe (Z61): pravica do odstopa po ZVPot-1 z izjemami za
 * hitro pokvarljivo blago, odprta živila in sestavljene darilne škatle s
 * sporočilom na kartici ter vzorčni obrazec za kopiranje.
 */
export default async function OdstopPage() {
  const { prodajalec, kontakt } = await naloziPravnePodatke();

  return (
    <PravnaStran
      naslov="Odstop od pogodbe"
      opis="Kako v 14 dneh odstopite od nakupa v spletni trgovini in kdaj ta pravica ne velja."
      posodobljeno={POSODOBLJENO}
      kazalo={POGLAVJA}
    >
      <Poglavje id="pravica" naslov="1. Pravica do odstopa">
        <p>
          Kot potrošnik imate pravico, da v 14 dneh brez navedbe razloga odstopite od pogodbe, sklenjene v naši
          spletni trgovini. Rok začne teči dan po tem, ko vi ali tretja oseba, ki ste jo določili (ne prevoznik),
          prejmete blago; pri prevzemu na kmetiji dan po prevzemu. Pri naročilu več kosov, ki jih dobite ločeno, rok
          teče od prejema zadnjega kosa.
        </p>
        <p>
          Če je darilo poslano na naslov prejemnika, rok teče od dneva, ko ga prejme prejemnik; od pogodbe odstopi
          kupec.
        </p>
      </Poglavje>

      <Poglavje id="izjeme" naslov="2. Kdaj pravica do odstopa ne velja">
        <p>V skladu z ZVPot-1 pravica do odstopa ne velja za:</p>
        <ul>
          <li>
            <strong className="font-semibold text-ink">hitro pokvarljivo blago</strong> ali blago s kratkim rokom
            uporabe, kot so sveža zelenjava, sveže sadje in jajca;
          </li>
          <li>
            <strong className="font-semibold text-ink">zapečateno blago</strong>, ki zaradi varovanja zdravja ali
            higienskih razlogov ni primerno za vračilo, če je bilo po dobavi odpečateno (npr. odprt kozarec
            marmelade, odprta steklenica olja ali soka, odprta embalaža začimb, liofiliziranega sadja ali
            testenin);
          </li>
          <li>
            <strong className="font-semibold text-ink">blago, izdelano po vaših navodilih</strong> ali jasno
            prilagojeno vam: to so sestavljene darilne škatle s sporočilom na kartici.
          </li>
        </ul>
        <p>
          Za darilne škatle brez sporočila na kartici in za neodprte izdelke, primerne za pošiljanje, pravica do
          odstopa velja.
        </p>
      </Poglavje>

      <Poglavje id="kako" naslov="3. Kako odstopite">
        <p>
          O odstopu nas obvestite z nedvoumno izjavo pred iztekom roka, najlažje po e-pošti na{" "}
          <EpostaProdajalca p={prodajalec} /> ali s pismom na naslov <Podatek v={prodajalec.naslov} />. Uporabite
          lahko obrazec spodaj, vendar ni obvezen. Rok je upoštevan, če izjavo pošljete pred njegovim iztekom.
          Prejem izjave vam potrdimo po e-pošti.
        </p>
        <p>V izjavi navedite številko naročila (npr. T-2026-0001) in izdelke, od katerih odstopate.</p>
      </Poglavje>

      <Poglavje id="vracilo-blaga" naslov="4. Vračilo blaga">
        <ul>
          <li>
            Blago nam vrnite ali ga prinesite na kmetijo brez nepotrebnega odlašanja, najpozneje v 14 dneh od
            dneva, ko ste nam poslali izjavo o odstopu.
          </li>
          <li>Neposredne stroške vračila blaga krijete sami.</li>
          <li>
            Odgovarjate za zmanjšanje vrednosti blaga, če ste z blagom ravnali drugače, kot je potrebno, da ugotovite
            njegovo naravo, lastnosti in delovanje.
          </li>
        </ul>
      </Poglavje>

      <Poglavje id="vracilo-kupnine" naslov="5. Vračilo kupnine">
        <p>
          Vsa prejeta plačila, vključno s stroški standardne dostave, vam vrnemo brez nepotrebnega odlašanja,
          najpozneje v 14 dneh od dneva, ko smo prejeli vašo izjavo o odstopu. Vračilo lahko zadržimo, dokler ne
          prejmemo vrnjenega blaga ali dokazila, da ste ga poslali, kar nastopi prej.
        </p>
        <p>
          Za vračilo uporabimo isto plačilno sredstvo, kot ste ga uporabili pri nakupu (pri plačilu s kartico vrnemo
          znesek na kartico), razen če se izrecno dogovorimo drugače. Vračilo za vas nima stroškov.
        </p>
      </Poglavje>

      <Poglavje id="obrazec" naslov="6. Obrazec za odstop">
        <p>
          Besedilo kopirajte v e-pošto, dopolnite podatke in ga pošljite na <EpostaProdajalca p={prodajalec} />.
          Podatki prodajalca:
        </p>
        <PodatkiProdajalca p={prodajalec} telefonPovezava={kontakt.telefonPovezava} />
        <ObrazecZaOdstop besedilo={obrazecZaOdstop(prodajalec)} />
        <p>
          Druge pravice in obveznosti so v{" "}
          <Link href={POT_POGOJEV} className={povezavaBesedila}>
            splošnih pogojih poslovanja
          </Link>
          .
        </p>
      </Poglavje>
    </PravnaStran>
  );
}
