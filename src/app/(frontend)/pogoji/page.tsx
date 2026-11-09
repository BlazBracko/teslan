import type { Metadata } from "next";
import Link from "next/link";
import { EpostaProdajalca, Podatek, PodatkiProdajalca, Poglavje, PravnaStran, povezavaBesedila } from "@/components/pravno/PravnaStran";
import { POT_DARIL, POT_ODSTOPA, POT_ZASEBNOSTI } from "@/components/postavitev/navigacija";
import { NAJDALJSE_SPOROCILO } from "@/darila/pravila";
import { formatirajCeno } from "@/lib/denar";
import { naloziPravnePodatke, POSODOBLJENO } from "@/pravno/podatki";

export const metadata: Metadata = {
  title: "Splošni pogoji poslovanja — Domačija Tešlan",
  description:
    "Splošni pogoji spletne trgovine Domačije Tešlan: naročilo, cene, plačilo, prevzem in pošiljanje, odstop in pritožbe.",
};

/** Podatki prodajalca in poštnina so iz nastavitev trgovine (baza). */
export const dynamic = "force-dynamic";

const POGLAVJA = [
  { id: "prodajalec", naslov: "1. Prodajalec" },
  { id: "uporaba", naslov: "2. Uporaba pogojev" },
  { id: "izdelki-in-cene", naslov: "3. Izdelki in cene" },
  { id: "narocilo", naslov: "4. Naročilo in sklenitev pogodbe" },
  { id: "placilo", naslov: "5. Plačilo" },
  { id: "dostava", naslov: "6. Prevzem in dostava" },
  { id: "darila", naslov: "7. Darilne škatle" },
  { id: "preklic", naslov: "8. Preklic naročila" },
  { id: "odstop", naslov: "9. Odstop od pogodbe" },
  { id: "skladnost", naslov: "10. Skladnost blaga in reklamacije" },
  { id: "zasebnost", naslov: "11. Varstvo osebnih podatkov" },
  { id: "spori", naslov: "12. Pritožbe in reševanje sporov" },
  { id: "koncne", naslov: "13. Končne določbe" },
];

/**
 * Splošni pogoji poslovanja (Z61): osnutek po ZVPot-1, podatki prodajalca
 * iz nastavitev, manjkajoči so označeni z `[manjka: …]`.
 */
export default async function PogojiPage() {
  const { nastavitve, prodajalec, kontakt } = await naloziPravnePodatke();
  const postnina = formatirajCeno(nastavitve.postninaCenti);
  const prag = formatirajCeno(nastavitve.pragBrezplacnePostnineCenti);

  return (
    <PravnaStran
      naslov="Splošni pogoji poslovanja"
      opis="Pogoji, ki veljajo za nakupe v spletni trgovini Domačije Tešlan."
      posodobljeno={POSODOBLJENO}
      kazalo={POGLAVJA}
    >
      <Poglavje id="prodajalec" naslov="1. Prodajalec">
        <p>Spletno trgovino na tej strani upravlja in blago prodaja:</p>
        <PodatkiProdajalca p={prodajalec} telefonPovezava={kontakt.telefonPovezava} />
        <p>
          Prodajalec prodaja pridelke in izdelke svoje kmetije. V nadaljevanju ga imenujemo »prodajalec« ali »mi«,
          kupca pa »kupec« ali »vi«.
        </p>
      </Poglavje>

      <Poglavje id="uporaba" naslov="2. Uporaba pogojev">
        <p>
          Ti pogoji urejajo nakup blaga v spletni trgovini med prodajalcem in kupcem. Ob oddaji naročila potrdite,
          da ste jih prebrali in se z njimi strinjate. Za vsako naročilo veljajo pogoji, objavljeni v času oddaje.
        </p>
        <p>
          Pogodba se sklene v slovenskem jeziku. Za razmerja s kupci, ki so potrošniki, velja Zakon o varstvu
          potrošnikov (ZVPot-1); teh pravic pogoji ne omejujejo.
        </p>
      </Poglavje>

      <Poglavje id="izdelki-in-cene" naslov="3. Izdelki in cene">
        <ul>
          <li>Cene so v evrih in vključujejo DDV. Poštnina je prikazana posebej, preden oddate naročilo.</li>
          <li>
            Cena velja v trenutku oddaje naročila. Če se cena ali razpoložljivost spremeni, ko je izdelek že v
            košarici, vas na to opozorimo v košarici in na blagajni.
          </li>
          <li>
            Nekateri pridelki so na voljo le v sezoni ali le za prevzem na kmetiji; to je označeno pri izdelku.
            Izdelki z oznako »Na voljo na kmetiji« se v spletni trgovini ne prodajajo.
          </li>
          <li>
            Fotografije so simbolične. Pridelki z domače kmetije se po videzu, barvi in velikosti lahko nekoliko
            razlikujejo od fotografije.
          </li>
        </ul>
      </Poglavje>

      <Poglavje id="narocilo" naslov="4. Naročilo in sklenitev pogodbe">
        <ol>
          <li>Izdelke ali darilno škatlo dodate v košarico.</li>
          <li>Na blagajni vpišete svoje podatke, izberete način prevzema in plačila ter potrdite te pogoje.</li>
          <li>
            Pred oddajo vidite povzetek naročila s ceno izdelkov, poštnino in skupnim zneskom. Do oddaje lahko
            naročilo poljubno popravite.
          </li>
          <li>
            Z gumbom »Oddaj naročilo« oziroma z uspešnim plačilom s kartico (gumb »Na plačilo«) oddate naročilo, ki
            vas zavezuje k plačilu.
          </li>
        </ol>
        <p>
          Pogodba je sklenjena, ko vam pošljemo potrdilo naročila na e-pošto. Potrdilo vsebuje številko naročila,
          izbrane izdelke in znesek ter povezavo do strani naročila. Naročila hranimo v elektronski obliki; njihovo
          vsebino lahko pri nas kadar koli zahtevate.
        </p>
        <p>
          <strong className="font-semibold text-ink">Potrdilo naročila ni račun.</strong> Račun izda prodajalec v
          skladu z veljavnimi predpisi.
        </p>
      </Poglavje>

      <Poglavje id="placilo" naslov="5. Plačilo">
        <ul>
          <li>
            <strong className="font-semibold text-ink">S kartico</strong> prek ponudnika plačil Stripe (plačilne
            kartice ter, kjer jih vaša naprava podpira, Apple Pay in Google Pay). Podatke kartice vpišete na varni
            strani ponudnika; prodajalec jih ne vidi in ne hrani. Če plačila ne zaključite v 30 minutah, se
            naročilo samodejno prekliče.
          </li>
          <li>
            <strong className="font-semibold text-ink">Ob prevzemu</strong> na kmetiji. Ta način je na voljo le pri
            prevzemu na kmetiji.
          </li>
        </ul>
        <p>Pri pošiljanju po pošti je mogoče plačati samo s kartico.</p>
      </Poglavje>

      <Poglavje id="dostava" naslov="6. Prevzem in dostava">
        <ul>
          <li>
            <strong className="font-semibold text-ink">Prevzem na kmetiji</strong> na naslovu{" "}
            <Podatek v={prodajalec.naslov} />. Ko je naročilo pripravljeno, vas obvestimo po e-pošti; termin prevzema
            se lahko dogovorimo tudi po telefonu. Prevzem je brezplačen.
          </li>
          <li>
            <strong className="font-semibold text-ink">Pošiljanje po pošti</strong> samo na naslove v Sloveniji.
            Poštnina znaša {postnina}, za naročila z vrednostjo izdelkov vsaj {prag} je brezplačna.
          </li>
          <li>
            Sveži pridelki in jajca so na voljo samo za prevzem na kmetiji. Če je tak izdelek v košarici, pošiljanje
            po pošti ni mogoče.
          </li>
          <li>
            Paket oddamo na pošto praviloma v nekaj delovnih dneh, najpozneje pa v 30 dneh od sklenitve pogodbe. Ko
            ga oddamo, vas obvestimo po e-pošti.
          </li>
          <li>
            Neprevzeta naročila za prevzem na kmetiji lahko po predhodnem obvestilu prekličemo (gl. točko 8).
          </li>
        </ul>
      </Poglavje>

      <Poglavje id="darila" naslov="7. Darilne škatle">
        <p>
          Na strani{" "}
          <Link href={POT_DARIL} className={povezavaBesedila}>
            Darila
          </Link>{" "}
          lahko izberete pripravljen program ali sami sestavite darilno škatlo iz izdelkov, primernih za darilo. Cena
          škatle je cena embalaže skupaj s cenami izbranih izdelkov.
        </p>
        <p>
          Škatli lahko dodate sporočilo na kartici (največ {NAJDALJSE_SPOROCILO} znakov), ki ga natisnemo oziroma
          napišemo in priložimo. Pri pošiljanju po pošti lahko darilo pošljemo neposredno na naslov prejemnika; v
          paket takrat ne priložimo cen.
        </p>
        <p>
          Sestavljena darilna škatla s sporočilom na kartici je izdelana po vaših navodilih, zato zanjo ne velja
          pravica do odstopa od pogodbe (gl.{" "}
          <Link href={POT_ODSTOPA} className={povezavaBesedila}>
            Odstop od pogodbe
          </Link>
          ).
        </p>
      </Poglavje>

      <Poglavje id="preklic" naslov="8. Preklic naročila">
        <p>
          Prodajalec lahko naročilo prekliče, če blaga izjemoma ne more dobaviti (npr. zaradi slabe letine ali
          poškodbe), če naročilo za prevzem na kmetiji ni prevzeto v dogovorjenem roku ali če plačilo s kartico ni
          bilo zaključeno. O preklicu vas obvestimo po e-pošti. Če ste že plačali s kartico, vam celoten znesek
          vrnemo na kartico v nekaj delovnih dneh.
        </p>
        <p>
          Če želite naročilo spremeniti ali preklicati, preden ga pripravimo, nas čim prej pokličite ali pišite na{" "}
          <EpostaProdajalca p={prodajalec} />.
        </p>
      </Poglavje>

      <Poglavje id="odstop" naslov="9. Odstop od pogodbe">
        <p>
          Kot potrošnik lahko v 14 dneh od prejema blaga brez navedbe razloga odstopite od pogodbe. Pravica ne velja
          za hitro pokvarljivo blago, za živila, ki ste jih po dobavi odprli, in za sestavljene darilne škatle s
          sporočilom na kartici. Postopek, roki, izjeme in obrazec za odstop so opisani na strani{" "}
          <Link href={POT_ODSTOPA} className={povezavaBesedila}>
            Odstop od pogodbe
          </Link>
          .
        </p>
      </Poglavje>

      <Poglavje id="skladnost" naslov="10. Skladnost blaga in reklamacije">
        <p>
          Prodajalec odgovarja za skladnost blaga v skladu z ZVPot-1. Če izdelek ob prejemu ni skladen z naročilom,
          je poškodovan ali pokvarjen, nam to sporočite po e-pošti ali telefonu in po možnosti priložite fotografijo.
          Pri svežih pridelkih in živilih vam svetujemo, da to storite takoj po prejemu, da lahko napako hitro
          ugotovimo.
        </p>
        <p>
          Glede na vašo izbiro in v skladu z zakonom bomo blago zamenjali, vam vrnili kupnino ali jo ustrezno
          znižali. Stroške vračila neskladnega blaga krijemo mi.
        </p>
      </Poglavje>

      <Poglavje id="zasebnost" naslov="11. Varstvo osebnih podatkov">
        <p>
          Osebne podatke, ki jih vpišete ob naročilu, uporabimo za izvedbo naročila in izpolnitev zakonskih
          obveznosti. Podrobnosti so v{" "}
          <Link href={POT_ZASEBNOSTI} className={povezavaBesedila}>
            politiki zasebnosti
          </Link>
          .
        </p>
      </Poglavje>

      <Poglavje id="spori" naslov="12. Pritožbe in reševanje sporov">
        <p>
          Pritožbo lahko podate po e-pošti na <EpostaProdajalca p={prodajalec} />, po telefonu ali po pošti na naslov
          prodajalca. Prejem pritožbe potrdimo, vas obvestimo, kako dolgo jo bomo obravnavali, in vam sporočimo
          odločitev. Spore poskušamo rešiti sporazumno.
        </p>
        <p>
          Prodajalec ne priznava nobenega izvajalca izvensodnega reševanja potrošniških sporov kot pristojnega za
          reševanje sporov, ki bi jih potrošnik sprožil po zakonu, ki ureja izvensodno reševanje potrošniških sporov.
          Če spora ne rešimo sporazumno, ga rešuje pristojno sodišče v Republiki Sloveniji.
        </p>
      </Poglavje>

      <Poglavje id="koncne" naslov="13. Končne določbe">
        <p>
          Prodajalec lahko pogoje spremeni. Spremembe objavimo na tej strani; za že oddana naročila veljajo pogoji,
          ki so veljali ob oddaji.
        </p>
      </Poglavje>
    </PravnaStran>
  );
}
