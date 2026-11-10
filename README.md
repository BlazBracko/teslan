# Domačija Tešlan — spletna stran in trgovina

Spletna stran in spletna trgovina Domačije Tešlan: katalog, košarica, blagajna s plačilom ob prevzemu ali s kartico (Stripe), darilne škatle, e-poštna obvestila in admin za urejanje ponudbe in naročil (Payload CMS). Načrt, ki je vir resnice za razvoj, je v [`docs/nacrti/spletna-trgovina.md`](docs/nacrti/spletna-trgovina.md); kar čaka na lastnika (ključi, nastavitve, pregledi, prehod v produkcijo), je **kontrolni seznam** v [`docs/nacrti/spletna-trgovina-predaja.md`](docs/nacrti/spletna-trgovina-predaja.md).

## Tehnologija

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Framer Motion, Zod, Payload CMS 3 (admin na `/admin`) s Postgres. Testi: Vitest (enote, integracija) in Playwright (e2e). Gostovanje: Railway.

## Zahteve

- Node.js `>=22.23.4 <23` (gl. `engines` v `package.json`)
- npm 10+
- Docker (Compose v2) za lokalni Postgres

## Zagon

```bash
npm ci
docker compose up -d         # Postgres 17 na portu 5432 (baza teslan in teslan_test)
cp .env.example .env.local   # nastavite DATABASE_URL in PAYLOAD_SECRET (gl. spodaj)
npm run migrate              # zgradi shemo baze z migracijami
npm run seed                 # demo katalog (izdelki, kategorije, skupine) in nastavitve trgovine
npm run dev                  # stran: http://localhost:3000, admin: http://localhost:3000/admin
```

Za lokalni razvoj v `.env.local` zadoščata:

```bash
DATABASE_URL=postgres://teslan:teslan@localhost:5432/teslan
PAYLOAD_SECRET=<izhod ukaza: openssl rand -hex 32>
```

Ob prvem obisku `/admin` (prazna baza) se odpre obrazec za prvega uporabnika, ki je vedno administrator. Če sta v `.env.local` nastavljena `SEED_ADMIN_EMAIL` in `SEED_ADMIN_PASSWORD`, ga ustvari že `npm run seed`.

## Skripte

| Ukaz | Kaj naredi |
|---|---|
| `npm run dev` | razvojni strežnik |
| `npm run build` / `npm run start` | produkcijska gradnja in zagon |
| `npm run typecheck` | `next typegen` + `tsc --noEmit` |
| `npm run lint` | ESLint (`eslint .`) |
| `npm test` | Vitest (enkratni zagon); `npm run test:watch` za sprotni način |
| `npm run test:e2e` | Playwright na produkcijski gradnji (izprazni, migrira in seeda testno bazo, zgradi in zažene strežnika na portih 3100 in 3101) |
| `npm run migrate` | izvede nove migracije Payload (`src/migrations`) |
| `npm run migrate:create -- <ime>` | ustvari migracijo iz sprememb zbirk |
| `npm run migrate:status` | pokaže, katere migracije so izvedene |
| `npm run seed` | dopolni bazo z začetnimi podatki (gl. Seed); obstoječega ne spreminja |
| `npm run seed:if-empty` | isto, a katalog samo, če v bazi ni nobenega izdelka (teče pred deployem) |
| `npm run pripravi-bazo` | `migrate` + `seed:if-empty` (Railway pred deployem) |
| `npm run generate:types` / `generate:importmap` | osveži `src/payload-types.ts` in import map admina |
| `npm run preveri:payload` | vse tri zgornje naenkrat; CI zahteva, da za njimi ni sprememb |

Za e2e je potreben Chromium: `npx playwright install chromium`. Če je brskalnik že nameščen drugje, nastavite `PLAYWRIGHT_CHROMIUM_EXECUTABLE=<pot>`. Z `E2E_SKIP_BUILD=1` Playwright preskoči gradnjo in uporabi obstoječo. Ista gradnja teče dvakrat: na portu 3100 kot produkcija in na 3101 z `NOINDEX=1` in Basic Auth (testno geslo iz `e2e/zascita.ts`) kot staging; testi v `e2e/noindex/` tečejo samo proti drugemu.

Plačila s kartico v e2e: brez testnih ključev Stripe v okolju Playwright zažene nadomestni Stripe ([`e2e/stripe-nadomestek.ts`](e2e/stripe-nadomestek.ts)) in tok s kartico preveri `e2e/placilo.spec.ts`; s `STRIPE_SECRET_KEY` (testni) in `STRIPE_WEBHOOK_SECRET` v okolju strežnika uporabljata pravi Stripe in teče `e2e/stripe-pravi.spec.ts` (S11).

## Plačila (Stripe)

Kartično plačilo teče prek gostovanega Stripe Checkout ([`src/narocila/stripe.ts`](src/narocila/stripe.ts)). Naročilo nastane s statusom „Čaka na plačilo“ in rezervirano zalogo; webhook `/api/stripe/webhook` ga ob plačilu označi kot plačano (status „Novo“, e-pošta E1 in E2), ob izteku seje (30 min) ali prekinitvi pa prekliče in vrne zalogo ([`src/narocila/potek-placila.ts`](src/narocila/potek-placila.ts)). Lokalno webhook posredujete s Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook` (izpisano skrivnost nastavite kot `STRIPE_WEBHOOK_SECRET`). Brez ključev je kartica na blagajni onemogočena.

## E-pošta (Resend)

Obvestila o naročilu so v [`src/eposta/narocila.ts`](src/eposta/narocila.ts), vsako v HTML in besedilni različici: E1 potrdilo kupcu in E2 obvestilo prodajalcu ob oddaji (ali plačilu s kartico), E3 „Pripravljeno za prevzem“, E4 „Poslano“ in E5 „Preklicano“ ob spremembi statusa v adminu ([`src/eposta/obvestila.ts`](src/eposta/obvestila.ts)). Preklic naročila, ki še čaka na plačilo s kartico, ne pošlje ničesar.

- Z `RESEND_API_KEY` gre pošta prek Resenda, sicer se izpiše v log strežnika ([`src/eposta/adapter.ts`](src/eposta/adapter.ts)). Pošiljatelj je `EMAIL_FROM` (privzeto `Domačija Tešlan <narocila@teslan.si>`, domena mora biti v Resendu overjena), odgovor gre na *E-pošta za obvestila* iz nastavitev trgovine.
- Z `EMAIL_REDIRECT_TO` (staging) gre vsa pošta na en naslov, zadeva se začne z `[STAGING → <prvotni prejemnik>]`.
- Napaka pri pošiljanju ne ustavi naročila ne spremembe statusa: zapiše se v log in na naročilo (*Tehnični podatki → Napaka pri pošiljanju e-pošte*).
- Test s pravim ključem (`src/eposta/adapter.test.ts`) pošlje eno sporočilo na Resendov testni naslov `delivered@resend.dev`; brez `RESEND_API_KEY` je preskočen.

## Identiteta in komponente

- Barve, pisavi (Fraunces za naslove, Inter za besedilo), radiji, sence, razmiki in gibanje so tokeni Tailwind 4 v [`src/app/(frontend)/globals.css`](<src/app/(frontend)/globals.css>) (`@theme`). Privzeta Tailwind paleta je izklopljena; v komponentah ni surovih barv.
- Pisavi sta v repu ([`src/app/(frontend)/pisave/`](<src/app/(frontend)/pisave/>), licenca SIL OFL 1.1) in se nalagata z `next/font/local`: vsaka je ena datoteka, omejena na latinico s šumniki in teže 400–700, Fraunces z zamrznjenimi mehkimi rezi (SOFT 50). Pripravi ju [`scripts/pripravi-pisave.sh`](scripts/pripravi-pisave.sh) (potrebuje `pip install fonttools brotli`); če potrebujete nov znak ali težo, popravite skripto in jo poženite znova.
- Knjižnica komponent je v [`src/components/ui/`](src/components/ui/) (gumb, polja, izbirniki, dialog, predal, zavihki, oznake, kartica, cena, obvestila, okostje, prazno stanje). Interaktivni deli so na Radix primitivih, gibanje (vzmeti) je v [`src/lib/motion.ts`](src/lib/motion.ts). Komponente uporabljajo lahke `m.*` elemente Framer Motion; animacije se naložijo odloženo prek `LazyMotion` ([`Gibanje.tsx`](src/components/ui/Gibanje.tsx)), zato `motion.*` v javnem delu ni dovoljen (`strict`). Ikone: Lucide prek `react-icons/lu`.
- Slogovni vodnik `/styleguide` pokaže vse to v vseh stanjih, a samo pri `NOINDEX=1` (staging, lokalno z `NOINDEX=1 npm run dev`); v produkciji vrne 404.
- `src/components/ui/tokeni.test.ts` preverja kontraste parov besedilo/ozadje (WCAG 2.2 AA) in da nove komponente ne vsebujejo surovih barv.

## Dostopnost in hitrost

- **Dostopnost (Z6, S17)**: [`e2e/dostopnost.spec.ts`](e2e/dostopnost.spec.ts) požene axe (`@axe-core/playwright`, vsa pravila) na vseh javnih straneh na namizju in mobilnem, s polno košarico in blagajno, na strani 404 in z odprtim mobilnim menijem; dovoljenih ni nobenih kršitev stopnje „serious“ ali „critical“. Isti test preveri preskok na vsebino, viden fokus s tipkovnico in vidnost vsebine pri zmanjšanem gibanju. Stanja z napakami (blagajna), dialogi in konfigurator preverjajo še ostali e2e testi.
- **Hitrost (S18)**: cilj na stagingu je Lighthouse (mobilno) Performance ≥ 85, Accessibility ≥ 95, SEO ≥ 95 za `/` in `/products`. Preverite z Lighthouse v Chromu (DevTools → Lighthouse → Mobile) ali z ukazom spodaj; za staging z geslom dodajte `--extra-headers` z glavo `Authorization: Basic …`. Pri `NOINDEX=1` SEO namenoma pade (stran se ne sme indeksirati), zato SEO merite brez njega.

  ```bash
  npx -y lighthouse@12.8.2 https://teslan-staging.up.railway.app/ --only-categories=performance,accessibility,best-practices,seo --view
  ```

- Kar pomaga hitrosti in naj ostane: glavna slika strani ima `preload` in `fetchPriority="high"` (ostale se nalagajo lenobno), slike se strežejo kot AVIF ali WebP (`next.config.ts`), pisavi sta podmnoženi (gl. zgoraj), animacije in polni `zod` niso v začetnem JavaScriptu (košarica v glavi uporablja `zod/mini`).
- Neobstoječe poti vrnejo slovensko stran 404 iz [`src/app/global-not-found.tsx`](src/app/global-not-found.tsx) (aplikacija ima dva korenska layouta, zato je potrebna `experimental.globalNotFound`); neobstoječ izdelek ali naročilo pokaže `src/app/(frontend)/not-found.tsx`.

## Okolja in spremenljivke

Vse spremenljivke so opisane v [`.env.example`](.env.example) in jih ob zagonu strežnika preveri [`src/env.ts`](src/env.ts) (Zod). Napačna oblika ali manjkajoča obvezna spremenljivka v produkciji ustavi zagon z jasnim sporočilom; vrednosti se nikoli ne izpišejo.

| Okolje | Veja | Opombe |
|---|---|---|
| produkcija | `main` | `https://www.teslan.si`; spaja samo lastnik |
| staging | `staging` | <https://teslan-staging.up.railway.app>; Railway samodejno deploya; `NOINDEX=1` (robots `Disallow: /`, glava `X-Robots-Tag`), geslo z `BASIC_AUTH_USER` + `BASIC_AUTH_PASSWORD` (`src/proxy.ts`, brez obeh je stran odprta), `EMAIL_REDIRECT_TO`, testna ključa Stripe |

Spremenljivke po okoljih (podrobno v `.env.example`):

| Spremenljivka | Staging | Produkcija |
|---|---|---|
| `DATABASE_URL`, `PAYLOAD_SECRET` | obvezni | obvezni (drugačen `PAYLOAD_SECRET`) |
| `NEXT_PUBLIC_SITE_URL` | staging URL | `https://www.teslan.si` |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | testna (`sk_test_…`) | live |
| `RESEND_API_KEY`, `EMAIL_FROM` | da | da |
| `EMAIL_REDIRECT_TO` | vaš e-naslov | **ne** |
| `S3_*` (Cloudflare R2) | bucket `teslan-staging` | bucket `teslan-prod` |
| `NOINDEX`, `BASIC_AUTH_USER`, `BASIC_AUTH_PASSWORD` | da | **ne** |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | neobvezno | neobvezno |
| `STRIPE_API_URL`, `EPOSTA_DNEVNIK`, `OMEJITEV_NAROCIL_NA_IP`, `TESTNE_SLIKE`, `TEST_DATABASE_URL` | samo testi in razvoj | **ne** |

## CI

`.github/workflows/ci.yml` teče na PR-jih v `staging` in `main` ter na pushu v `staging`: typecheck, preverjanje generiranih datotek in migracij Payload (`npm run preveri:payload`), lint, Vitest, Playwright; vse s Postgres 17 servisom (testna baza).

## Razvojni tok

Vsak korak načrta je ena veja `nacrt/kN-<kratko>` iz najnovejšega `staging` in en PR v `staging`, ki se združi z merge commitom, ko je CI zelen.

## Payload, baza in migracije

- Konfiguracija je v [`src/payload.config.ts`](src/payload.config.ts), zbirke v [`src/payload/kolekcije/`](src/payload/kolekcije/), global *Nastavitve trgovine* v [`src/payload/globali/`](src/payload/globali/), pravila dostopa v [`src/payload/dostop.ts`](src/payload/dostop.ts).
- **Katalog**: `kategorije`, `skupine-ponudbe` (ploščice na domači strani) in `izdelki` (način prodaje, sezona, velikosti s ceno v centih in zalogo). Pravila vnosa so v [`src/katalog/pravila-izdelka.ts`](src/katalog/pravila-izdelka.ts), sezone in razpoložljivost (časovni pas `Europe/Ljubljana`) v [`src/katalog/sezona.ts`](src/katalog/sezona.ts) in [`src/katalog/razpolozljivost.ts`](src/katalog/razpolozljivost.ts).
- **Podatki na javnih straneh** se berejo prek [`src/katalog/podatki.ts`](src/katalog/podatki.ts) (predpomnjeno z oznakami `katalog` in `nastavitve-trgovine`). Ob vsaki spremembi v adminu hooki iz [`src/payload/revalidacija.ts`](src/payload/revalidacija.ts) oznako razveljavijo, zato je sprememba vidna ob naslednjem ogledu; varovalka je osvežitev po 60 s. Strani s podatki iz CMS se izrišejo ob zahtevi, zato gradnja ne potrebuje baze.
- **Košarica** je v `localStorage` brskalnika (ključ `teslan-kosarica`, samo id-ji izdelkov in velikosti ter količine). Cene, zalogo in pravila dostave vedno izračuna strežnik: čiste funkcije so v [`src/kosarica/`](src/kosarica/) (`cene.ts` poštnina in DDV, `dostava.ts` pravila dostave in plačila, `preverjanje.ts` preverjanje postavk), stran `/kosarica` jih kliče prek strežniške akcije `akcije.ts`.
- **Vsebinske strani in besedila v kodi**: `/dostava` (dostava in plačilo), `/vprasanja` (pogosta vprašanja, vsebina v [`src/vsebina/vprasanja.ts`](src/vsebina/vprasanja.ts)) ter deli domače strani in strani „O nas“ v [`src/components/domov/`](src/components/domov/). Zneski, kontakt in navodila za prevzem se v ta besedila vstavijo iz nastavitev trgovine, seznam izdelkov samo za prevzem in koledar sezone iz kataloga. Osnutke, ki čakajo na lastnikov pregled, na stagingu označi [`OznakaOsnutka`](src/components/vsebina/OznakaOsnutka.tsx); seznam je v dokumentu o predaji.
- **Glava** je plavajoči otok (`position: fixed`, [`Glava.tsx`](src/components/postavitev/Glava.tsx)); prostor zanjo rezervira `main` z `pt-glava` (`--spacing-glava` v `globals.css`). Ploskve, ki morajo segati pod glavo (uvod domače strani, `PageHeader`), uporabijo `-mt-glava pt-glava`.
- `src/app/(frontend)/` je javna stran (svoj korenski layout), `src/app/(payload)/` pa admin in REST API (`/admin`, `/api/...`), ki ju ustvari Payload.
- Admin je v slovenščini (prevod `sl` iz `@payloadcms/translations`), vsako polje ima opis.
- **Vloge**: `admin` ureja vse; `urednik` ureja vsebino trgovine in svoj račun, drugih uporabnikov in nastavitev trgovine ne vidi. Prvi uporabnik je vedno admin; nadaljnje doda admin v *Nastavitve → Uporabniki*.
- **Slike** (`media`, opis `alt` je obvezen): ko so nastavljene vse `S3_*` spremenljivke, gredo v Cloudflare R2 in se strežejo z `S3_PUBLIC_URL`; sicer na lokalni disk v `media/` (ni v gitu).
- **Shema se spreminja samo z migracijami**, tudi lokalno (`push` je izklopljen): po spremembi zbirke poženite `npm run migrate:create -- <ime>`, preglejte novo datoteko v `src/migrations`, nato `npm run migrate`. Isti ukaz teče pred vsakim deployem.
- **Lokalni Postgres** (`docker-compose.yml`) ima fiksno ime projekta `teslan`, zato si vse kopije repa (tudi git worktreeji) delijo en vsebnik. Razvoj uporablja bazo `teslan`, testi `teslan_test`.
- **Testi** tečejo na `teslan_test` (ali `TEST_DATABASE_URL`, ime se mora končati s `_test`) in jo sami izpraznijo: integracijski testi Vitest (`*.int.test.ts`) pred zagonom, Playwright pa v `e2e/priprava.ts`.

## Seed

[`src/seed/seed.ts`](src/seed/seed.ts), podatki v [`src/seed/podatki.ts`](src/seed/podatki.ts) (načrt §6). Seed je idempotenten in obstoječih zapisov nikoli ne spremeni ali izbriše:

1. Če ni nobenega uporabnika in sta nastavljena `SEED_ADMIN_EMAIL` in `SEED_ADMIN_PASSWORD`, ustvari administratorja.
2. Katalog: slike iz `public/` v `media`, 10 kategorij, 4 skupine ponudbe in 25 izdelkov s cenika (zaloga 20 na velikost, DDV 9,5 %). Doda le, kar manjka (po slugu oz. imenu). `seed:if-empty` katalog preskoči, če je v bazi že kak izdelek, zato se izdelki, ki jih lastnik izbriše, ob deployu ne vrnejo.
3. Nastavitve trgovine s privzetimi vrednostmi (poštnina 5,00 €, brezplačna od 50,00 €, naslov in telefon kmetije), če še niso bile shranjene.
4. Demo darila (mala in velika škatla, programa „Okusi Dolenjske“ in „Za kuharje“ z opisom „[DEMO]“), če v bazi ni nobene škatle in nobenega programa.

## Deploy (Railway)

[`railway.json`](railway.json): gradnja `npm run build`, pred deployem `npm run pripravi-bazo` (`migrate` + `seed:if-empty`), zagon `npm run start`.

V okolju morata biti nastavljena `DATABASE_URL` (Railway Postgres) in `PAYLOAD_SECRET`; brez njiju se produkcijski strežnik ne zažene. Za slike na stagingu in v produkciji so potrebne še `S3_*` spremenljivke (R2), sicer se slike shranijo na disk vsebnika in se ob naslednjem deployu izgubijo.

- **Staging** se deploya samodejno ob vsakem pushu v `staging` (združen PR). Baza stagina je na strežniku blazServer; ker Railway ukaza pred deployem (`preDeployCommand`) doslej ni izvedel, migracije in seed po deployu zaženete s strežnika z `~/teslan-staging-db/deploy-staging.sh <pot do repa>` (zažene `npm run pripravi-bazo` na bazi stagina in deploya isti commit). Dokler nove migracije niso izvedene, strani, ki berejo nove stolpce, vračajo napako 500.
- **Produkcija** (`main`): PR `staging` → `main` odpre in združi samo lastnik, ko je izpolnjen kontrolni seznam v [`docs/nacrti/spletna-trgovina-predaja.md`](docs/nacrti/spletna-trgovina-predaja.md) (načrt §12). Pred prvim deployem preverite, da ukaz pred deployem teče (log deploya *Pre-deploy*); če ne, `npm run pripravi-bazo` zaženite ročno s produkcijskim `DATABASE_URL`.
- Po spremembi spremenljivk na Railwayu je potreben nov deploy (*Deploy* ali *Redeploy*); ob zagonu strežnik v log izpiše opozorila za manjkajoče neobvezne nastavitve (e-pošta, `NEXT_PUBLIC_SITE_URL`, delno nastavljeno geslo stagina).

## Predaja

Kontrolni seznam za lastnika (ključi Stripe, Resend, R2, geslo stagina, prvi admin, podatki trgovine, pravni pregled, pospravljanje vej, prehod v produkcijo) in stanje sprejemnih kriterijev S1–S20 sta v [`docs/nacrti/spletna-trgovina-predaja.md`](docs/nacrti/spletna-trgovina-predaja.md).
