# Predaja: kaj čaka na lastnika

Sproten seznam manjkajočih zunanjih ključev, preskočenih preizkusov in opravil, ki zahtevajo lastnikovo roko (načrt §11). Vsak korak K1–K13 dopiše svoje. K13 ga dokonča v kontrolni seznam.

## Manjkajoči ključi in nastavitve

| Kaj | Potrebno od | Nadomestek do takrat | Kje nastaviti |
|---|---|---|---|
| `DATABASE_URL` (Railway Postgres za staging) | K3 | **brez nadomestka na stagingu**: strežnik se ne zažene, `npm run migrate` pred deployem pade (lokalno in v CI Postgres v Dockerju) | Railway → staging → dodajte Postgres, spremenljivko povežite s storitvijo |
| `PAYLOAD_SECRET` (staging) | K3 | **brez nadomestka na stagingu**: strežnik se ne zažene | Railway → staging → Variables (`openssl rand -hex 32`) |
| `S3_BUCKET`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL` (R2 `teslan-staging`) | K3 | lokalni disk (`media/`); na Railwayu se slike ob vsakem deployu izgubijo | Cloudflare R2 + Railway → staging → Variables |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` (staging) | K4 | brez njiju seed administratorja ne ustvari; prvega uporabnika (vedno administrator) ustvarite na `/admin` | Railway → staging → Variables (geslo vsaj 12 znakov) |

## Preskočeni preizkusi

| Preizkus | Razlog | Kaj ga omogoči |
|---|---|---|
| Nalaganje slik v R2 (Z83, S19) | ni R2 ključev; testi preverijo lokalni disk in sestavo javnega URL-ja | R2 bucket in `S3_*` na stagingu, ročni preizkus v adminu (K13) |

## Dnevnik po korakih

### K1 Temelji
- Ni novih zunanjih ključev; nobena spremenljivka še ni obvezna (`OBVEZNE_V_PRODUKCIJI` v `src/env.ts` je prazen). K3 doda `DATABASE_URL` in `PAYLOAD_SECRET`, zato morata biti od K3 naprej nastavljena v Railway staging okolju, sicer se strežnik ne zažene.
- Ni preskočenih preizkusov.
- GitHub secrets za CI zaenkrat niso potrebni (Stripe test ključ je neobvezen, K8).

### K2 Identiteta in UI knjižnica
- Ni novih zunanjih ključev in ni preskočenih preizkusov.
- Pisavi Fraunces in Inter se ob gradnji prenesejo z Google Fonts (`next/font`), zato gradnja potrebuje dostop do interneta (Railway ga ima).
- Lastnik oceni novo identiteto na `/styleguide` na stagingu (vidno samo z `NOINDEX=1`). Vse barve so na enem mestu v `src/app/globals.css`, zato je sprememba palete poceni (načrt §11).
- Obstoječe strani še uporabljajo staro paleto (označeno kot prehodna v `globals.css`), a že nove pisave; K5 jih zgradi na novo in prehodno paleto odstrani.

### K3 Payload osnova
- Od tega koraka sta `DATABASE_URL` in `PAYLOAD_SECRET` obvezni v produkcijskem načinu. **Dokler ju lastnik ne nastavi v Railway staging okolju, deploy stagina ne uspe** (pre-deploy `npm run migrate` pade, strežnik se ne zažene). Railway ob neuspelem deployu pusti prejšnjo različico.
- `railway.json`: gradnja `npm run build`, pred deployem `npm run migrate`, zagon `npm run start` (K4 doda `seed:if-empty`).
- Brez R2 se slike shranjujejo na disk vsebnika (`media/`), ki se na Railwayu ob deployu izbriše. Za staging so potrebne `S3_*` spremenljivke (R2 bucket `teslan-staging` z javnim dostopom).
- Prvi uporabnik admina se ustvari na `/admin` (obrazec ob prazni bazi) in je vedno administrator; od K4 ga ustvari seed iz `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`. Račun urednika za Sandija doda administrator v *Nastavitve → Uporabniki* (§11, točka 7).
- E-pošta Payloada (npr. pozabljeno geslo) se do K9 izpiše v log strežnika.

### K4 Model kataloga in seed
- Pred deployem teče `npm run pripravi-bazo` (`migrate` + `seed:if-empty`). Ob prvem uspešnem deployu na staging seed napolni katalog (25 izdelkov, 10 kategorij, 4 skupine ponudbe) in nastavitve trgovine; ob naslednjih deployih katalog ne spreminja, če je v bazi vsaj en izdelek.
- Novi spremenljivki `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` (neobvezni, gl. tabelo zgoraj).
- Seed naloži slike iz `public/` v `media`. Brez R2 so na disku vsebnika in se ob naslednjem deployu izgubijo, zapisi v bazi pa ostanejo (slike na strani se ne prikažejo, dokler jih lastnik ne naloži znova ali dokler ni R2). Zato je R2 na stagingu priporočljiv pred prvim deployem s seedom.
- Podatki prodajalca v *Nastavitve trgovine* so prazni razen naslova, telefona in e-pošte kmetije (§7); naziv, davčno, matično številko in KMG-MID vnese lastnik.
- `src/data/contact.ts` ostane, ker ga še uporabljajo noga, sekcije domače strani in podstrani; K5 ga zamenja z nastavitvami trgovine.
- Ni preskočenih preizkusov.
