import type { AdminViewServerProps } from "payload";
import { Gutter } from "@payloadcms/ui";
import Link from "next/link";
import {
  LuCircleHelp,
  LuExternalLink,
  LuGift,
  LuImage,
  LuPackage,
  LuPlus,
  LuSettings,
  LuStore,
  LuTags,
  LuTriangleAlert,
} from "react-icons/lu";
import { jeAdmin } from "../dostop";
import { formatirajCeno } from "@/lib/denar";
import { OZNAKE_STATUSOV, type StatusNarocila } from "@/narocila/statusi";
import { nizkaZaloga, pozdrav, steviloNarocil, uraVSloveniji } from "./pregled";

const A = "/admin";
const NAJVEC_VRSTIC = 6;

const oblikaDatuma = new Intl.DateTimeFormat("sl-SI", {
  day: "numeric",
  month: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Ljubljana",
});

/** Seznam naročil, filtriran po statusu (filter v naslovu razume Payload). */
const naslovNarocil = (status: StatusNarocila) => `${A}/collections/narocila?where[status][equals]=${status}`;

/**
 * Nadzorna plošča admina (nadomesti Payloadovo, `admin.components.views.dashboard`):
 * kaj čaka na Sandija (nova naročila, prevzemi, zaloga), stanje trgovine in
 * bližnjice do pogostih opravil. Bere prek lokalnega API-ja na strežniku.
 */
export async function NadzornaPlosca({ initPageResult }: AdminViewServerProps) {
  const { req } = initPageResult;
  const { payload, user } = req;
  const admin = jeAdmin(user as never);

  const prestej = (status: StatusNarocila) =>
    payload.count({ collection: "narocila", where: { status: { equals: status } }, req }).then((r) => r.totalDocs);

  const [nova, zaPrevzem, poslana, cakajoPlacilo, zadnja, izdelki, skatle, nastavitve] = await Promise.all([
    prestej("novo"),
    prestej("pripravljeno"),
    prestej("poslano"),
    prestej("caka-placilo"),
    payload.find({
      collection: "narocila",
      where: { status: { in: ["novo", "pripravljeno", "poslano"] } },
      sort: "-createdAt",
      limit: NAJVEC_VRSTIC,
      depth: 0,
      req,
    }),
    payload.find({
      collection: "izdelki",
      where: { objavljen: { equals: true } },
      limit: 0,
      pagination: false,
      depth: 0,
      select: { ime: true, objavljen: true, nacinProdaje: true, velikosti: true },
      req,
    }),
    payload.find({
      collection: "tipi-skatel",
      limit: 0,
      pagination: false,
      depth: 0,
      select: { ime: true, aktiven: true, zaloga: true },
      req,
    }),
    // Stanje trgovine mora videti tudi urednik, nastavitve pa ureja le admin.
    payload.findGlobal({ slug: "nastavitve-trgovine", overrideAccess: true, depth: 0 }),
  ]);

  const zaloga = nizkaZaloga(izdelki.docs, skatle.docs);
  const odprta = nastavitve.trgovinaOdprta !== false;
  const ime = (user as { ime?: string } | null)?.ime;

  return (
    <Gutter className="teslan-plosca">
      <header className="teslan-plosca__glava">
        <div>
          <h1 className="teslan-plosca__pozdrav">{pozdrav(ime, uraVSloveniji(new Date()))}</h1>
          <p className="teslan-plosca__uvod">
            Tu urejate spletno trgovino Domačije Tešlan. Spodaj je, kar čaka na vas.
          </p>
        </div>
        <div className={`teslan-stanje ${odprta ? "teslan-stanje--odprta" : "teslan-stanje--zaprta"}`}>
          <LuStore aria-hidden />
          <div>
            <strong>{odprta ? "Trgovina je odprta" : "Trgovina je zaprta"}</strong>
            <span>
              {odprta ? "Kupci lahko oddajo naročila." : "Kupci vidijo izdelke, naročiti pa jih ne morejo."}
            </span>
          </div>
          {admin ? (
            <Link href={`${A}/globals/nastavitve-trgovine`} className="teslan-stanje__povezava">
              {odprta ? "Zapri" : "Odpri"}
            </Link>
          ) : null}
        </div>
      </header>

      <section aria-labelledby="teslan-narocila" className="teslan-plosca__del">
        <h2 id="teslan-narocila" className="teslan-plosca__naslov">
          Naročila
        </h2>
        <ul className="teslan-stevci">
          <Stevec
            href={naslovNarocil("novo")}
            stevilo={nova}
            oznaka="Novih naročil"
            namig={nova ? "Pripravite jih in spremenite status." : "Ni novih naročil."}
            poudarek={nova > 0}
          />
          <Stevec
            href={naslovNarocil("pripravljeno")}
            stevilo={zaPrevzem}
            oznaka="Čaka na prevzem"
            namig="Kupec je obveščen, da lahko pride."
          />
          <Stevec
            href={naslovNarocil("poslano")}
            stevilo={poslana}
            oznaka="Poslanih"
            namig="Ko paket prispe, jih zaključite."
          />
          <Stevec
            href={naslovNarocil("caka-placilo")}
            stevilo={cakajoPlacilo}
            oznaka="Čaka na plačilo s kartico"
            namig="Neplačana se po 35 minutah prekličejo sama."
          />
        </ul>

        <div className="teslan-kartica">
          <div className="teslan-kartica__glava">
            <h3>
              Za obdelavo <span className="teslan-kartica__stevilo">({steviloNarocil(zadnja.totalDocs)})</span>
            </h3>
            <Link href={`${A}/collections/narocila`}>Vsa naročila</Link>
          </div>
          {zadnja.docs.length === 0 ? (
            <p className="teslan-prazno">Trenutno ni naročil, ki bi čakala na vas.</p>
          ) : (
            <ul className="teslan-seznam">
              {zadnja.docs.map((n) => (
                <li key={n.id}>
                  <Link href={`${A}/collections/narocila/${n.id}`} className="teslan-seznam__vrstica">
                    <span className="teslan-seznam__glavno">
                      <strong>{n.stevilka}</strong>
                      <span>
                        {[n.kupec?.ime, n.kupec?.priimek].filter(Boolean).join(" ")}
                        {" · "}
                        {n.nacinDostave === "posta" ? "pošta" : "prevzem"}
                        {" · "}
                        {oblikaDatuma.format(new Date(n.createdAt))}
                      </span>
                    </span>
                    <span className="teslan-seznam__desno">
                      <span>{formatirajCeno(n.skupajCenti)}</span>
                      <span className={`teslan-znacka teslan-znacka--${n.status}`}>
                        {OZNAKE_STATUSOV[n.status as StatusNarocila]}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <div className="teslan-plosca__stolpca">
        <section aria-labelledby="teslan-zaloga" className="teslan-kartica">
          <div className="teslan-kartica__glava">
            <h2 id="teslan-zaloga">
              <LuTriangleAlert aria-hidden /> Zaloga, ki pohaja
            </h2>
            <Link href={`${A}/collections/izdelki`}>Vsi izdelki</Link>
          </div>
          {zaloga.length === 0 ? (
            <p className="teslan-prazno">Vseh objavljenih izdelkov je dovolj (več kot 3 kosi).</p>
          ) : (
            <ul className="teslan-seznam">
              {zaloga.slice(0, 10).map((v) => (
                <li key={`${v.vrsta}-${v.id}-${v.velikost ?? ""}`}>
                  <Link
                    href={`${A}/collections/${v.vrsta === "skatla" ? "tipi-skatel" : "izdelki"}/${v.id}`}
                    className="teslan-seznam__vrstica"
                  >
                    <span className="teslan-seznam__glavno">
                      <strong>{v.ime}</strong>
                      {v.velikost ? <span>{v.velikost}</span> : null}
                    </span>
                    <span className={`teslan-znacka ${v.zaloga === 0 ? "teslan-znacka--poslo" : "teslan-znacka--malo"}`}>
                      {v.zaloga === 0 ? "Ni na zalogi" : `Še ${v.zaloga}`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {zaloga.length > 10 ? (
            <p className="teslan-prazno">In še {zaloga.length - 10}. Zalogo spremenite pri izdelku.</p>
          ) : null}
        </section>

        <section aria-labelledby="teslan-hitro" className="teslan-kartica">
          <div className="teslan-kartica__glava">
            <h2 id="teslan-hitro">Hitra opravila</h2>
          </div>
          <ul className="teslan-bliznjice">
            <Bliznjica href={`${A}/collections/izdelki/create`} ikona={<LuPlus aria-hidden />}>
              Dodaj nov izdelek
            </Bliznjica>
            <Bliznjica href={`${A}/collections/izdelki`} ikona={<LuPackage aria-hidden />}>
              Uredi izdelke, cene in zalogo
            </Bliznjica>
            <Bliznjica href={`${A}/collections/media/create`} ikona={<LuImage aria-hidden />}>
              Naloži sliko
            </Bliznjica>
            <Bliznjica href={`${A}/collections/darilni-programi`} ikona={<LuGift aria-hidden />}>
              Darila in darilne škatle
            </Bliznjica>
            <Bliznjica href={`${A}/collections/kategorije`} ikona={<LuTags aria-hidden />}>
              Kategorije
            </Bliznjica>
            {admin ? (
              <Bliznjica href={`${A}/globals/nastavitve-trgovine`} ikona={<LuSettings aria-hidden />}>
                Poštnina in podatki trgovine
              </Bliznjica>
            ) : null}
            <Bliznjica href="/" ikona={<LuExternalLink aria-hidden />} zunanja>
              Odpri spletno stran
            </Bliznjica>
            <Bliznjica href={`${A}/pomoc`} ikona={<LuCircleHelp aria-hidden />}>
              Pomoč: kako kaj naredim
            </Bliznjica>
          </ul>
        </section>
      </div>

      <p className="teslan-plosca__noga">
        Spremembe izdelkov, cen in zaloge se na spletni strani pokažejo v največ minuti.
      </p>
    </Gutter>
  );
}

function Stevec({
  href,
  stevilo,
  oznaka,
  namig,
  poudarek = false,
}: {
  href: string;
  stevilo: number;
  oznaka: string;
  namig: string;
  poudarek?: boolean;
}) {
  return (
    <li>
      <Link href={href} className={`teslan-stevec${poudarek ? " teslan-stevec--poudarek" : ""}`}>
        <span className="teslan-stevec__stevilo">{stevilo}</span>
        <span className="teslan-stevec__oznaka">{oznaka}</span>
        <span className="teslan-stevec__namig">{namig}</span>
      </Link>
    </li>
  );
}

function Bliznjica({
  href,
  ikona,
  zunanja = false,
  children,
}: {
  href: string;
  ikona: React.ReactNode;
  zunanja?: boolean;
  children: React.ReactNode;
}) {
  return (
    <li>
      {zunanja ? (
        <a href={href} target="_blank" rel="noreferrer" className="teslan-bliznjica">
          {ikona}
          <span>{children}</span>
          <span className="teslan-skrito"> (odpre se v novem zavihku)</span>
        </a>
      ) : (
        <Link href={href} className="teslan-bliznjica">
          {ikona}
          <span>{children}</span>
        </Link>
      )}
    </li>
  );
}
