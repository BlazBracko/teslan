# Domačija Tešlan — spletna stran in trgovina

Spletna stran in (v nastajanju) spletna trgovina Domačije Tešlan. Načrt, ki je vir resnice za razvoj, je v [`docs/nacrti/spletna-trgovina.md`](docs/nacrti/spletna-trgovina.md); kar čaka na lastnika (ključi, nastavitve), je zbrano v [`docs/nacrti/spletna-trgovina-predaja.md`](docs/nacrti/spletna-trgovina-predaja.md).

> Ta README je osnutek iz koraka K1. Razdelki o bazi, seedu in deployu se dopolnijo v K3, K4 in K13.

## Tehnologija

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Framer Motion, Zod. Testi: Vitest (enote, integracija) in Playwright (e2e). Gostovanje: Railway.

## Zahteve

- Node.js `>=22.23.4 <23` (gl. `engines` v `package.json`)
- npm 10+
- Od K3 naprej: Docker za lokalni Postgres

## Zagon

```bash
npm ci
cp .env.example .env.local   # izpolnite, kar potrebujete; v K1 ni obveznih spremenljivk
npm run dev                  # http://localhost:3000
```

## Skripte

| Ukaz | Kaj naredi |
|---|---|
| `npm run dev` | razvojni strežnik |
| `npm run build` / `npm run start` | produkcijska gradnja in zagon |
| `npm run typecheck` | `next typegen` + `tsc --noEmit` |
| `npm run lint` | ESLint (`eslint .`) |
| `npm test` | Vitest (enkratni zagon); `npm run test:watch` za sprotni način |
| `npm run test:e2e` | Playwright na produkcijski gradnji (sam zgradi in zažene strežnik na portu 3100) |

Za e2e je potreben Chromium: `npx playwright install chromium`. Če je brskalnik že nameščen drugje, nastavite `PLAYWRIGHT_CHROMIUM_EXECUTABLE=<pot>`. Z `E2E_SKIP_BUILD=1` Playwright preskoči gradnjo in uporabi obstoječo.

## Okolja in spremenljivke

Vse spremenljivke so opisane v [`.env.example`](.env.example) in jih ob zagonu strežnika preveri [`src/env.ts`](src/env.ts) (Zod). Napačna oblika ali manjkajoča obvezna spremenljivka v produkciji ustavi zagon z jasnim sporočilom; vrednosti se nikoli ne izpišejo.

| Okolje | Veja | Opombe |
|---|---|---|
| produkcija | `main` | `https://www.teslan.si`; spaja samo lastnik |
| staging | `staging` | Railway samodejno deploya; `NOINDEX=1`, basic auth |

## CI

`.github/workflows/ci.yml` teče na PR-jih v `staging` in `main` ter na pushu v `staging`: typecheck, lint, Vitest, Playwright (s Postgres 17 servisom za integracijske teste od K3 naprej).

## Razvojni tok

Vsak korak načrta je ena veja `nacrt/kN-<kratko>` iz najnovejšega `staging` in en PR v `staging`, ki se združi z merge commitom, ko je CI zelen.

## Baza, seed, deploy

Dopolni se v K3 (Payload, Postgres, migracije, `railway.json`) in K4 (seed).
