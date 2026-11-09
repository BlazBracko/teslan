# Domačija Tešlan — spletna stran in trgovina

Spletna stran in (v nastajanju) spletna trgovina Domačije Tešlan. Načrt, ki je vir resnice za razvoj, je v [`docs/nacrti/spletna-trgovina.md`](docs/nacrti/spletna-trgovina.md); kar čaka na lastnika (ključi, nastavitve), je zbrano v [`docs/nacrti/spletna-trgovina-predaja.md`](docs/nacrti/spletna-trgovina-predaja.md).

> Ta README je osnutek. Razdelek o predaji se dopolni v K13.

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

Za e2e je potreben Chromium: `npx playwright install chromium`. Če je brskalnik že nameščen drugje, nastavite `PLAYWRIGHT_CHROMIUM_EXECUTABLE=<pot>`. Z `E2E_SKIP_BUILD=1` Playwright preskoči gradnjo in uporabi obstoječo. Ista gradnja teče dvakrat: na portu 3100 kot produkcija in na 3101 z `NOINDEX=1` kot staging; testi v `e2e/noindex/` tečejo samo proti drugemu.

Plačila s kartico v e2e: brez testnih ključev Stripe v okolju Playwright zažene nadomestni Stripe ([`e2e/stripe-nadomestek.ts`](e2e/stripe-nadomestek.ts)) in tok s kartico preveri `e2e/placilo.spec.ts`; s `STRIPE_SECRET_KEY` (testni) in `STRIPE_WEBHOOK_SECRET` v okolju strežnika uporabljata pravi Stripe in teče `e2e/stripe-pravi.spec.ts` (S11).

## Plačila (Stripe)

Kartično plačilo teče prek gostovanega Stripe Checkout ([`src/narocila/stripe.ts`](src/narocila/stripe.ts)). Naročilo nastane s statusom „Čaka na plačilo“ in rezervirano zalogo; webhook `/api/stripe/webhook` ga ob plačilu označi kot plačano (status „Novo“, e-pošta E1 in E2), ob izteku seje (30 min) ali prekinitvi pa prekliče in vrne zalogo ([`src/narocila/potek-placila.ts`](src/narocila/potek-placila.ts)). Lokalno webhook posredujete s Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook` (izpisano skrivnost nastavite kot `STRIPE_WEBHOOK_SECRET`). Brez ključev je kartica na blagajni onemogočena.

## Identiteta in komponente

- Barve, pisavi (Fraunces za naslove, Inter za besedilo), radiji, sence, razmiki in gibanje so tokeni Tailwind 4 v [`src/app/(frontend)/globals.css`](<src/app/(frontend)/globals.css>) (`@theme`). Privzeta Tailwind paleta je izklopljena; v komponentah ni surovih barv.
- Knjižnica komponent je v [`src/components/ui/`](src/components/ui/) (gumb, polja, izbirniki, dialog, predal, zavihki, oznake, kartica, cena, obvestila, okostje, prazno stanje). Interaktivni deli so na Radix primitivih, gibanje (vzmeti) je v [`src/lib/motion.ts`](src/lib/motion.ts). Ikone: Lucide prek `react-icons/lu`.
- Slogovni vodnik `/styleguide` pokaže vse to v vseh stanjih, a samo pri `NOINDEX=1` (staging, lokalno z `NOINDEX=1 npm run dev`); v produkciji vrne 404.
- `src/components/ui/tokeni.test.ts` preverja kontraste parov besedilo/ozadje (WCAG 2.2 AA) in da nove komponente ne vsebujejo surovih barv.

## Okolja in spremenljivke

Vse spremenljivke so opisane v [`.env.example`](.env.example) in jih ob zagonu strežnika preveri [`src/env.ts`](src/env.ts) (Zod). Napačna oblika ali manjkajoča obvezna spremenljivka v produkciji ustavi zagon z jasnim sporočilom; vrednosti se nikoli ne izpišejo.

| Okolje | Veja | Opombe |
|---|---|---|
| produkcija | `main` | `https://www.teslan.si`; spaja samo lastnik |
| staging | `staging` | Railway samodejno deploya; `NOINDEX=1`, basic auth |

## CI

`.github/workflows/ci.yml` teče na PR-jih v `staging` in `main` ter na pushu v `staging`: typecheck, preverjanje generiranih datotek in migracij Payload (`npm run preveri:payload`), lint, Vitest, Playwright; vse s Postgres 17 servisom (testna baza).

## Razvojni tok

Vsak korak načrta je ena veja `nacrt/kN-<kratko>` iz najnovejšega `staging` in en PR v `staging`, ki se združi z merge commitom, ko je CI zelen.

## Payload, baza in migracije

- Konfiguracija je v [`src/payload.config.ts`](src/payload.config.ts), zbirke v [`src/payload/kolekcije/`](src/payload/kolekcije/), global *Nastavitve trgovine* v [`src/payload/globali/`](src/payload/globali/), pravila dostopa v [`src/payload/dostop.ts`](src/payload/dostop.ts).
- **Katalog**: `kategorije`, `skupine-ponudbe` (ploščice na domači strani) in `izdelki` (način prodaje, sezona, velikosti s ceno v centih in zalogo). Pravila vnosa so v [`src/katalog/pravila-izdelka.ts`](src/katalog/pravila-izdelka.ts), sezone in razpoložljivost (časovni pas `Europe/Ljubljana`) v [`src/katalog/sezona.ts`](src/katalog/sezona.ts) in [`src/katalog/razpolozljivost.ts`](src/katalog/razpolozljivost.ts).
- **Podatki na javnih straneh** se berejo prek [`src/katalog/podatki.ts`](src/katalog/podatki.ts) (predpomnjeno z oznakami `katalog` in `nastavitve-trgovine`). Ob vsaki spremembi v adminu hooki iz [`src/payload/revalidacija.ts`](src/payload/revalidacija.ts) oznako razveljavijo, zato je sprememba vidna ob naslednjem ogledu; varovalka je osvežitev po 60 s. Strani s podatki iz CMS se izrišejo ob zahtevi, zato gradnja ne potrebuje baze.
- **Košarica** je v `localStorage` brskalnika (ključ `teslan-kosarica`, samo id-ji izdelkov in velikosti ter količine). Cene, zalogo in pravila dostave vedno izračuna strežnik: čiste funkcije so v [`src/kosarica/`](src/kosarica/) (`cene.ts` poštnina in DDV, `dostava.ts` pravila dostave in plačila, `preverjanje.ts` preverjanje postavk), stran `/kosarica` jih kliče prek strežniške akcije `akcije.ts`.
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

## Deploy (Railway)

[`railway.json`](railway.json): gradnja `npm run build`, pred deployem `npm run pripravi-bazo` (`migrate` + `seed:if-empty`), zagon `npm run start`.

V okolju morata biti nastavljena `DATABASE_URL` (Railway Postgres) in `PAYLOAD_SECRET`; brez njiju se produkcijski strežnik ne zažene. Za slike na stagingu in v produkciji so potrebne še `S3_*` spremenljivke (R2), sicer se slike shranijo na disk vsebnika in se ob naslednjem deployu izgubijo.
