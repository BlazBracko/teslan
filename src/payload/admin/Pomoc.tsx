import type { AdminViewServerProps } from "payload";
import { DefaultTemplate } from "@payloadcms/next/templates";
import { Gutter, SetStepNav } from "@payloadcms/ui";
import Link from "next/link";
import { redirect } from "next/navigation";
import { jeAdmin } from "../dostop";

const A = "/admin";

/**
 * Stran „Pomoč“ (`/admin/pomoc`, `admin.components.views.pomoc`): kratka
 * navodila za pogosta opravila v jeziku lastnika, brez tehničnih izrazov.
 * Lastni pogledi niso zaščiteni sami od sebe, zato preverimo prijavo.
 */
export function Pomoc({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, locale, permissions, visibleEntities } = initPageResult;
  if (!req.user) redirect(`${A}/login?redirect=${encodeURIComponent(`${A}/pomoc`)}`);
  const admin = jeAdmin(req.user as never);

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={req.payload}
      permissions={permissions}
      searchParams={searchParams}
      user={req.user ?? undefined}
      visibleEntities={visibleEntities}
    >
      <SetStepNav nav={[{ label: "Pomoč" }]} />
      <Gutter className="teslan-pomoc">
        <h1>Pomoč</h1>
        <p className="teslan-pomoc__uvod">
          Kratka navodila za najpogostejša opravila. Kliknite vprašanje, da se odpre odgovor. Pri vsakem polju v
          obrazcih je pod njim tudi siv opis, kaj pomeni.
        </p>

        <h2>Naročila</h2>
        <Vprasanje naslov="Prišlo je novo naročilo. Kaj naredim?">
          <ol>
            <li>
              O vsakem naročilu dobite e-pošto. V adminu ga najdete pod{" "}
              <Link href={`${A}/collections/narocila`}>Naročila</Link> (najnovejše je zgoraj).
            </li>
            <li>Odprite ga in preverite postavke, način dostave in opombo kupca.</li>
            <li>
              Ko je paket pripravljen, spremenite <strong>Status</strong>:
              <ul>
                <li>
                  pri <strong>prevzemu na kmetiji</strong> izberite „Pripravljeno za prevzem“,
                </li>
                <li>
                  pri <strong>pošti</strong> vpišite številko pošiljke (če jo imate) in izberite „Poslano“.
                </li>
              </ul>
            </li>
            <li>
              Kliknite <strong>Shrani</strong>. Kupec takoj dobi e-pošto o spremembi.
            </li>
            <li>
              Ko kupec naročilo prevzame (in plača), označite <strong>Plačano</strong> in izberite „Zaključeno“.
            </li>
          </ol>
        </Vprasanje>
        <Vprasanje naslov="Kako prekličem naročilo?">
          <p>
            Odprite naročilo, v polje <strong>Razlog preklica</strong> vpišite kratko pojasnilo za kupca, izberite
            status „Preklicano“ in shranite. Zaloga izdelkov se vrne sama, kupec dobi e-pošto.
          </p>
          <p>
            Če je kupec plačal s kartico, mu denar vrnete v Stripu (Payments → plačilo → Refund). Admin denarja ne
            vrača sam.
          </p>
        </Vprasanje>
        <Vprasanje naslov="Kaj pomeni „Čaka na plačilo“?">
          <p>
            Kupec je izbral plačilo s kartico, a plačila še ni zaključil. Ko Stripe plačilo potrdi, se naročilo samo
            premakne med nova. Če ga kupec ne plača v 35 minutah, se samo prekliče in zaloga se vrne. Teh naročil vam
            ni treba urejati.
          </p>
        </Vprasanje>

        <h2>Izdelki, cene in zaloga</h2>
        <Vprasanje naslov="Kako spremenim zalogo ali ceno?">
          <ol>
            <li>
              Odprite <Link href={`${A}/collections/izdelki`}>Izdelki</Link> in kliknite izdelek.
            </li>
            <li>
              Spodaj pri <strong>Velikosti</strong> popravite <strong>Zalogo</strong> ali <strong>Ceno</strong>.
            </li>
            <li>
              Cena je v centih: 550 pomeni 5,50 €. Pod poljem se izpiše znesek v evrih, da lahko preverite.
            </li>
            <li>
              Kliknite <strong>Shrani</strong>. Sprememba je na strani vidna v največ minuti.
            </li>
          </ol>
          <p>Zaloga se ob vsakem naročilu zmanjša sama, ob preklicu pa vrne.</p>
        </Vprasanje>
        <Vprasanje naslov="Kako dodam nov izdelek?">
          <ol>
            <li>
              Kliknite <Link href={`${A}/collections/izdelki/create`}>Dodaj nov izdelek</Link>.
            </li>
            <li>Vpišite ime, izberite kategorijo in napišite kratek opis.</li>
            <li>Dodajte sliko (prva slika je glavna).</li>
            <li>
              Izberite <strong>Način prodaje</strong> in dodajte vsaj eno velikost s ceno in zalogo.
            </li>
            <li>
              Desno označite <strong>Objavljen</strong>, da ga kupci vidijo, in shranite.
            </li>
          </ol>
        </Vprasanje>
        <Vprasanje naslov="Kako izdelek začasno skrijem?">
          <p>
            Odprite izdelek, desno odkljukajte <strong>Objavljen</strong> in shranite. Izdelek ostane v adminu, na
            strani pa ni več viden. Če ga želite le začasno ne prodajati, lahko zalogo nastavite na 0: izdelek je
            viden z oznako „Ni na zalogi“.
          </p>
        </Vprasanje>
        <Vprasanje naslov="Kako dodam sliko?">
          <p>
            Pri izdelku kliknite <strong>Ustvari novo</strong> pod Slike ali sliko povlecite v okvir. Vsaka slika
            potrebuje kratek <strong>opis</strong> (npr. „Šopek zelenih špargljev na leseni mizi“), ki ga slepim
            prebere bralnik zaslona. Vse slike so tudi pod <Link href={`${A}/collections/media`}>Slike</Link>.
          </p>
        </Vprasanje>

        <h2>Darila</h2>
        <Vprasanje naslov="Kako urejam darilne škatle in darila?">
          <p>
            <Link href={`${A}/collections/tipi-skatel`}>Tipi darilnih škatel</Link> so prazne škatle (cena, število
            mest, zaloga). <Link href={`${A}/collections/darilni-programi`}>Darilni programi</Link> so že sestavljena
            darila, ki jih kupec doda v košarico z enim klikom. V škatlo gredo le izdelki z oznako „Primerno za darilno
            škatlo“.
          </p>
        </Vprasanje>

        <h2>Trgovina in račun</h2>
        {admin ? (
          <Vprasanje naslov="Kako zaprem trgovino (npr. med dopustom)?">
            <p>
              V <Link href={`${A}/globals/nastavitve-trgovine`}>Nastavitvah trgovine</Link> odkljukajte{" "}
              <strong>Trgovina je odprta</strong> in shranite. Izdelki so še vidni, naročiti pa jih ni mogoče. Tam
              spremenite tudi poštnino in e-pošto za obvestila.
            </p>
          </Vprasanje>
        ) : (
          <Vprasanje naslov="Kako zaprem trgovino (npr. med dopustom)?">
            <p>To lahko naredi administrator v Nastavitvah trgovine. Prosite ga, naj trgovino zapre ali odpre.</p>
          </Vprasanje>
        )}
        <Vprasanje naslov="Kako spremenim geslo?">
          <p>
            Kliknite svojo ikono desno zgoraj (<Link href={`${A}/account`}>Račun</Link>) in izberite{" "}
            <strong>Spremeni geslo</strong>. Če ste geslo pozabili, na prijavi kliknite „Ste pozabili geslo?“ in na
            e-pošto boste dobili povezavo za novo geslo.
          </p>
        </Vprasanje>
      </Gutter>
    </DefaultTemplate>
  );
}

function Vprasanje({ naslov, children }: { naslov: string; children: React.ReactNode }) {
  return (
    <details className="teslan-vprasanje">
      <summary>{naslov}</summary>
      <div className="teslan-vprasanje__odgovor">{children}</div>
    </details>
  );
}
