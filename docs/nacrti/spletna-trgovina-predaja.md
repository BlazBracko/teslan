# Predaja: kaj čaka na lastnika

Sproten seznam manjkajočih zunanjih ključev, preskočenih preizkusov in opravil, ki zahtevajo lastnikovo roko (načrt §11). Vsak korak K1–K13 dopiše svoje. K13 ga dokonča v kontrolni seznam.

## Manjkajoči ključi in nastavitve

| Kaj | Potrebno od | Nadomestek do takrat | Kje nastaviti |
|---|---|---|---|
| `DATABASE_URL` (Railway Postgres za staging) | K3 | **brez nadomestka na stagingu**: strežnik se ne zažene, `npm run migrate` pred deployem pade (lokalno in v CI Postgres v Dockerju) | Railway → staging → dodajte Postgres, spremenljivko povežite s storitvijo |
| `PAYLOAD_SECRET` (staging) | K3 | **brez nadomestka na stagingu**: strežnik se ne zažene | Railway → staging → Variables (`openssl rand -hex 32`) |
| `S3_BUCKET`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL` (R2 `teslan-staging`) | K3 | lokalni disk (`media/`); na Railwayu se slike ob vsakem deployu izgubijo | Cloudflare R2 + Railway → staging → Variables |
| `STRIPE_SECRET_KEY` (testni `sk_test_…` za staging), `STRIPE_WEBHOOK_SECRET` | K8 | brez njiju je plačilo s kartico na blagajni onemogočeno, zato tudi pošiljanje po pošti (samo kartica, Z22); prevzem s plačilom ob prevzemu deluje | Stripe → Developers → API keys; Webhooks → endpoint `https://<staging>/api/stripe/webhook` z dogodki `checkout.session.completed`, `checkout.session.expired` (neobvezno še `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`) → Signing secret; oboje v Railway → staging → Variables |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` (staging) | K4 | brez njiju seed administratorja ne ustvari; prvega uporabnika (vedno administrator) ustvarite na `/admin` | Railway → staging → Variables (geslo vsaj 12 znakov) |

## Preskočeni preizkusi

| Preizkus | Razlog | Kaj ga omogoči |
|---|---|---|
| Nalaganje slik v R2 (Z83, S19) | ni R2 ključev; testi preverijo lokalni disk in sestavo javnega URL-ja | R2 bucket in `S3_*` na stagingu, ročni preizkus v adminu (K13) |
| S11 s pravim Stripom (`e2e/stripe-pravi.spec.ts`: kartica 4242 4242 4242 4242, prekinitev) | ni testnih ključev Stripe; isti tok (blagajna → Checkout → podpisan webhook → potrdilo, prekinitev) preveri `e2e/placilo.spec.ts` z nadomestnim Stripom (`e2e/stripe-nadomestek.ts`), logiko pa integracijski testi (S8) | GitHub secrets `STRIPE_SECRET_KEY` (testni) in `STRIPE_WEBHOOK_SECRET` (poljuben `whsec_…`, ali iz `stripe listen`) ter ju dodati v okolje koraka Playwright v `.github/workflows/ci.yml`; lokalno: ključa v okolju pred `npm run test:e2e` |
| Testno kartično naročilo prek webhooka na stagingu (S19) | ni Stripe računa in webhooka za staging | ključa in webhook zgoraj, nato ročni preizkus (K13) |

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

### K7 Blagajna in naročila
- Ni novih zunanjih ključev. Novi neobvezni spremenljivki: `OMEJITEV_NAROCIL_NA_IP` (privzeto 5 naročil na IP v 10 minutah; na stagingu in v produkciji je ne nastavljajte) in `EPOSTA_DNEVNIK` (samo za teste).
- **Plačilo s kartico še ni na voljo** (Stripe pride s K8): na blagajni je možnost vidna, a onemogočena. Ker pošta zahteva kartico (Z22), do K8 in brez Stripe ključev na stagingu ni mogoče oddati naročila po pošti; prevzem s plačilom ob prevzemu deluje v celoti.
- E-pošta E1 (kupcu) in E2 (na `emailObvestil` iz nastavitev) se do K9 izpiše v log strežnika kot besedilo; povezava v E1 in admin povezava v E2 sta sestavljeni iz `NEXT_PUBLIC_SITE_URL`, zato mora biti na stagingu nastavljen.
- Omejitev naročil na IP vzame zadnji vnos glave `X-Forwarded-For` (naslov, ki ga vidi Railwayev posrednik). Če se izkaže, da Railway glave ne doda tako, je treba to preveriti na stagingu (K13).
- `/pogoji` je začasna stran z osnovnimi podatki (blagajna jo potrebuje za potrditev pogojev); celotno besedilo in povezave v nogi doda K11.
- Ni preskočenih preizkusov.

### K8 Stripe
- Nova spremenljivka za staging: `STRIPE_SECRET_KEY` in `STRIPE_WEBHOOK_SECRET` (obe ali nobena, gl. tabelo zgoraj). **Dokler ju ni, je kartica na blagajni onemogočena in naročil po pošti ni mogoče oddati**; prevzem s plačilom ob prevzemu deluje.
- Webhook endpoint v Stripu: `https://<staging>/api/stripe/webhook`, dogodka `checkout.session.completed` in `checkout.session.expired`. Pot mora ostati dosegljiva brez Basic Auth (K12 jo izvzame, Z74).
- `NEXT_PUBLIC_SITE_URL` mora biti na stagingu nastavljen: iz njega se sestavita naslova, kamor Stripe vrne kupca (potrdilo naročila, `/blagajna/preklic`). Brez njega se uporabi naslov zahteve.
- Načini plačila se v Checkoutu prikažejo po nastavitvah v Stripu (kartice; Apple Pay in Google Pay vklopite v *Settings → Payment methods*; za Apple Pay na lastni domeni Stripe ne zahteva ničesar, ker je stran gostovana).
- Varovalka: če dogodek webhooka ne pride (npr. napačna skrivnost), se kartična naročila, ki čakajo na plačilo dlje kot 35 minut, ob naslednji oddaji naročila uskladijo s Stripom (preklic in vrnitev zaloge oz. potrditev plačila). Potrdilo po vrnitvi s plačila stanje vedno preveri pri Stripu, zato kupec plačano naročilo vidi tudi brez webhooka.
- Vračila ostajajo ročna v Stripu (izven obsega). Če kupec plača naročilo, ki ga je Sandi medtem preklical, se naročilo označi kot plačano z interno opombo „Znesek vrnite kupcu v Stripu.“
- `STRIPE_API_URL` je samo za e2e teste (nadomestni Stripe); na stagingu in v produkciji ga ne nastavljajte.
- Preskočen preizkus: S11 s pravim Stripom (gl. tabelo preskočenih preizkusov).

### K10 Darila
- Ni novih zunanjih ključev in ni preskočenih preizkusov. E2E test darila po pošti na naslov prejemnika (`e2e/darila.spec.ts`, Z55) plača z nadomestnim Stripom; s pravimi ključi se preskoči kot ostali testi z nadomestkom.
- K9 (e-pošta) je bil po odločitvi lastnika preskočen do naslednjega dne, zato K10 uporablja obstoječi dnevniški adapter (`src/eposta/dnevnik.ts`): vsebina škatle, sporočilo na kartici (E2) in oznaka darila ter naslov prejemnika (E2) so dodani v besedilni različici obvestil E1/E2. K9 jih mora prenesti v HTML predloge.
- Ob prvem deployu po K10 seed (`seed:if-empty`) na stagingu doda demo darila (malo in veliko škatlo, programa „Okusi Dolenjske“ in „Za kuharje“, opisi z „[DEMO]“), ker v bazi še ni nobene škatle in nobenega programa. Kasneje izbrisanih daril ne vrne; če jih ne želite, škatlo označite kot neaktivno ali program kot neobjavljen.
- Lastnik v adminu (*Darila*) vnese prave tipe škatel (slike, cene, zalogo) in programe. Velikost izdelka v programu se vpiše z oznako (npr. „41 ml (15 g)“) ali pusti prazna za prvo velikost.
- Slike škatel v demo podatkih niso nastavljene (ni fotografij); stran pokaže nadomestno ploskev z ikono darila.
