import type { Metadata } from "next";
import Link from "next/link";
import { EpostaProdajalca, PodatkiProdajalca, Poglavje, PravnaStran, povezavaBesedila } from "@/components/pravno/PravnaStran";
import { POT_POGOJEV } from "@/components/postavitev/navigacija";
import { KLJUC_SHRAMBE } from "@/kosarica/postavke";
import { naloziPravnePodatke, POSODOBLJENO } from "@/pravno/podatki";
import { metapodatkiStrani } from "@/seo/metapodatki";

export const metadata: Metadata = metapodatkiStrani({
  naslov: "Politika zasebnosti",
  opis: "Kako Domačija Tešlan zbira, uporablja in varuje osebne podatke kupcev, kateri obdelovalci jih obdelujejo in katere piškotke uporablja stran.",
  pot: "/privacyPolicy",
});

/** Podatki upravljavca so iz nastavitev trgovine (baza). */
export const dynamic = "force-dynamic";

const POGLAVJA = [
  { id: "upravljavec", naslov: "1. Upravljavec" },
  { id: "podatki", naslov: "2. Katere podatke obdelujemo" },
  { id: "nameni", naslov: "3. Nameni in pravne podlage" },
  { id: "obdelovalci", naslov: "4. Obdelovalci in prenos podatkov" },
  { id: "hramba", naslov: "5. Kako dolgo hranimo podatke" },
  { id: "piskotki", naslov: "6. Piškotki in shramba v brskalniku" },
  { id: "varnost", naslov: "7. Varnost" },
  { id: "pravice", naslov: "8. Vaše pravice" },
  { id: "spremembe", naslov: "9. Spremembe politike" },
];

/**
 * Politika zasebnosti (Z60, Z61): upravljavec iz nastavitev, podatki pri
 * naročilu, obdelovalci (Stripe, Resend, Cloudflare, Railway) in samo nujni
 * piškotki oziroma shramba (brez piškotne pasice).
 */
export default async function PrivacyPolicyPage() {
  const { prodajalec, kontakt } = await naloziPravnePodatke();

  return (
    <PravnaStran
      naslov="Politika zasebnosti"
      opis="Kako zbiramo, uporabljamo in varujemo vaše osebne podatke."
      posodobljeno={POSODOBLJENO}
      kazalo={POGLAVJA}
    >
      <p className="type-body-lg text-ink-muted">
        Ta politika opisuje, katere osebne podatke obdelujemo, ko uporabljate našo spletno stran in spletno trgovino
        ali stopite v stik z nami, zakaj jih potrebujemo in kakšne pravice imate. Podatke obdelujemo v skladu s
        Splošno uredbo o varstvu podatkov (GDPR) in Zakonom o varstvu osebnih podatkov (ZVOP-2).
      </p>

      <Poglavje id="upravljavec" naslov="1. Upravljavec">
        <p>Upravljavec vaših osebnih podatkov je:</p>
        <PodatkiProdajalca p={prodajalec} telefonPovezava={kontakt.telefonPovezava} />
        <p>
          Za vsa vprašanja o osebnih podatkih nam pišite na <EpostaProdajalca p={prodajalec} />. Pooblaščene osebe
          za varstvo podatkov nismo dolžni imenovati.
        </p>
      </Poglavje>

      <Poglavje id="podatki" naslov="2. Katere podatke obdelujemo">
        <p>
          <strong className="font-semibold text-ink">Pri naročilu</strong> podatke, ki jih vpišete na blagajni:
        </p>
        <ul>
          <li>ime, priimek, e-poštni naslov in telefonsko številko;</li>
          <li>pri pošiljanju po pošti naslov dostave (ulica s hišno številko, poštna številka in kraj);</li>
          <li>pri darilu ime in naslov prejemnika ter sporočilo na kartici, če ga napišete;</li>
          <li>opombo k naročilu;</li>
          <li>
            vsebino naročila (izdelki, količine, cene), način prevzema in plačila, stanje plačila ter čas, ko ste
            potrdili splošne pogoje.
          </li>
        </ul>
        <p>
          <strong className="font-semibold text-ink">Pri plačilu s kartico</strong> podatke kartice vpišete
          neposredno pri ponudniku plačil Stripe. Mi jih ne vidimo in ne hranimo; od Stripa prejmemo le podatek, ali
          je bilo plačilo uspešno, in oznako plačila.
        </p>
        <p>
          <strong className="font-semibold text-ink">Ob obisku strani</strong> strežnik za zaščito pred zlorabo
          trgovine začasno (največ 10 minut, samo v pomnilniku) uporabi naslov IP, s katerega je oddano naročilo.
          Gostitelj strani zaradi delovanja in varnosti vodi tehnične dnevnike zahtev.
        </p>
        <p>
          <strong className="font-semibold text-ink">Ko nam pišete ali nas pokličete</strong>, obdelujemo vaše ime,
          kontaktne podatke in vsebino sporočila.
        </p>
      </Poglavje>

      <Poglavje id="nameni" naslov="3. Nameni in pravne podlage">
        <ul>
          <li>
            <strong className="font-semibold text-ink">Izvedba naročila</strong> (priprava, prevzem ali pošiljanje,
            plačilo, obvestila o stanju naročila po e-pošti, reševanje reklamacij in odstopov): sklenitev in izvajanje
            pogodbe (člen 6(1)(b) GDPR).
          </li>
          <li>
            <strong className="font-semibold text-ink">Računovodstvo in davki</strong> (hramba podatkov o prodaji):
            zakonska obveznost (člen 6(1)(c) GDPR).
          </li>
          <li>
            <strong className="font-semibold text-ink">Zaščita pred zlorabo</strong> trgovine in varnost strani:
            zakoniti interes (člen 6(1)(f) GDPR).
          </li>
          <li>
            <strong className="font-semibold text-ink">Odgovor na vaše sporočilo</strong>: zakoniti interes oziroma
            ukrepi pred sklenitvijo pogodbe na vašo zahtevo.
          </li>
        </ul>
        <p>
          Podatkov ne uporabljamo za oglaševanje, ne pošiljamo e-novic in jih ne prodajamo. Avtomatiziranega
          odločanja in profiliranja ne izvajamo.
        </p>
      </Poglavje>

      <Poglavje id="obdelovalci" naslov="4. Obdelovalci in prenos podatkov">
        <p>Pri delovanju trgovine nam pomagajo ponudniki storitev, ki podatke obdelujejo po naših navodilih:</p>
        <ul>
          <li>
            <strong className="font-semibold text-ink">Stripe</strong> (Stripe Payments Europe, Ltd., Irska): plačila
            s kartico. Za preprečevanje goljufij in izpolnjevanje predpisov o plačilih je Stripe za del podatkov
            samostojni upravljavec.
          </li>
          <li>
            <strong className="font-semibold text-ink">Resend</strong> (Resend, Inc., ZDA): pošiljanje e-poštnih
            obvestil o naročilu.
          </li>
          <li>
            <strong className="font-semibold text-ink">Cloudflare</strong> (Cloudflare, Inc., ZDA): domena, varnost
            strani in shranjevanje slik izdelkov.
          </li>
          <li>
            <strong className="font-semibold text-ink">Railway</strong> (Railway Corporation, ZDA): gostovanje
            spletne strani in baze podatkov z naročili.
          </li>
        </ul>
        <p>
          Nekateri ponudniki imajo sedež ali strežnike zunaj Evropskega gospodarskega prostora. Prenos podatkov k
          njim temelji na sklepu Evropske komisije o ustreznosti (okvir EU-ZDA za zasebnost podatkov) ali na
          standardnih pogodbenih klavzulah.
        </p>
        <p>
          Podatke za dostavo (ime, naslov, telefon) posredujemo izvajalcu poštnih storitev, ko paket oddamo na
          pošto. Drugim podatkov ne posredujemo, razen če to zahteva zakon.
        </p>
      </Poglavje>

      <Poglavje id="hramba" naslov="5. Kako dolgo hranimo podatke">
        <ul>
          <li>
            Podatke o naročilih hranimo toliko časa, kot zahtevajo računovodski in davčni predpisi (praviloma 10 let po
            koncu leta, v katerem je bil izdan račun), sicer do izteka rokov za uveljavljanje zahtevkov iz pogodbe.
          </li>
          <li>Neplačana naročila s kartico, ki se samodejno prekličejo, hranimo kot preklicana naročila.</li>
          <li>Sporočila in povpraševanja hranimo, dokler je to potrebno za odgovor in morebitno nadaljnje sodelovanje.</li>
        </ul>
      </Poglavje>

      <Poglavje id="piskotki" naslov="6. Piškotki in shramba v brskalniku">
        <p>
          Stran uporablja samo nujne piškotke in shrambo, brez katerih trgovina ne deluje. Analitičnih, oglasnih ali
          sledilnih piškotkov ne uporabljamo, zato vas za soglasje ne sprašujemo.
        </p>
        {/* Na ozkem zaslonu tabela drsi vodoravno: območje mora biti
            dosegljivo s tipkovnico (puščici), zato ima fokus in ime (Z6). */}
        <div
          role="region"
          aria-label="Tabela piškotkov"
          tabIndex={0}
          className="overflow-x-auto rounded-lg ring-1 ring-line"
        >
          <table className="w-full min-w-[32rem] text-left type-small">
            <caption className="sr-only">Nujni piškotki in shramba v brskalniku</caption>
            <thead className="bg-surface text-ink">
              <tr>
                <th scope="col" className="p-3 font-semibold">
                  Ime
                </th>
                <th scope="col" className="p-3 font-semibold">
                  Namen
                </th>
                <th scope="col" className="p-3 font-semibold">
                  Trajanje
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              <tr>
                <td className="p-3 font-mono">{KLJUC_SHRAMBE}</td>
                <td className="p-3">
                  Vsebina košarice (izdelki, količine, vsebina darilnih škatel in sporočilo na kartici) v lokalni shrambi
                  brskalnika (localStorage). Ne pošilja se nam samodejno.
                </td>
                <td className="p-3">Do oddaje naročila ali dokler košarice ne izpraznite</td>
              </tr>
              <tr>
                <td className="p-3 font-mono">payload-token</td>
                <td className="p-3">Prijava v administracijo trgovine. Nastavi se samo osebju, ki se prijavi.</td>
                <td className="p-3">Do odjave oziroma poteka seje</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Ko plačujete s kartico, ste na strani ponudnika Stripe, ki uporablja svoje piškotke za varnost plačila in
          preprečevanje goljufij.
        </p>
      </Poglavje>

      <Poglavje id="varnost" naslov="7. Varnost">
        <p>
          Povezava s stranjo je šifrirana (HTTPS). Do naročil v administraciji imajo dostop le prijavljene osebe na
          kmetiji. Stran naročila, ki jo prejmete po e-pošti, je zaščitena z naključnim ključem v povezavi, zato
          povezave ne delite z drugimi.
        </p>
      </Poglavje>

      <Poglavje id="pravice" naslov="8. Vaše pravice">
        <p>V skladu z GDPR imate pravico do:</p>
        <ul>
          <li>dostopa do svojih podatkov in kopije podatkov,</li>
          <li>popravka netočnih podatkov,</li>
          <li>izbrisa podatkov, ki jih ni treba hraniti po zakonu,</li>
          <li>omejitve obdelave,</li>
          <li>prenosljivosti podatkov,</li>
          <li>ugovora obdelavi, ki temelji na zakonitem interesu.</li>
        </ul>
        <p>
          Zahtevo pošljite na <EpostaProdajalca p={prodajalec} />; odgovorimo najpozneje v enem mesecu. Če menite, da
          vaše podatke obdelujemo nezakonito, lahko vložite pritožbo pri Informacijskem pooblaščencu RS (Dunajska
          cesta 22, 1000 Ljubljana,{" "}
          <a href="https://www.ip-rs.si" className={povezavaBesedila} rel="noopener noreferrer" target="_blank">
            www.ip-rs.si
            <span className="sr-only"> (odpre se v novem zavihku)</span>
          </a>
          ).
        </p>
      </Poglavje>

      <Poglavje id="spremembe" naslov="9. Spremembe politike">
        <p>
          Politiko lahko posodobimo, na primer ob novi storitvi ali spremembi predpisov. Veljavna različica je vedno
          objavljena na tej strani. Pogoji nakupa so v{" "}
          <Link href={POT_POGOJEV} className={povezavaBesedila}>
            splošnih pogojih poslovanja
          </Link>
          .
        </p>
      </Poglavje>
    </PravnaStran>
  );
}
