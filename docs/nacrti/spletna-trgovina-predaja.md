# Predaja: kontrolni seznam za lastnika

Kar čaka na lastnika (načrt §11 in §12): zunanji ključi, nastavitve, vsebina, pregledi in pospravljanje. Koraki K1–K13 so združeni v `staging`; spodnji seznam je dokončan v K13. Podrobnosti za vsako točko so v tabelah in dnevniku pod seznamom.

Staging: <https://teslan-staging.up.railway.app> (Railway, okolje *staging*). Baza stagina teče na strežniku blazServer (ne na Railwayu), migracije po vsakem deployu zažene `~/teslan-staging-db/deploy-staging.sh`, ker Railway ukaza pred deployem ne izvede.

## Kontrolni seznam

### 1. Staging: spremenljivke v Railway → staging → Variables

Ob pregledu v K13 (2026-11-10) so na stagingu nastavljene samo `DATABASE_URL` in `PAYLOAD_SECRET`.

- [ ] **`NOINDEX=1`**: zdaj ni nastavljen, zato `/robots.txt` na stagingu dovoli indeksiranje in ni glave `X-Robots-Tag` (Z71). Nastavite ga takoj.
- [ ] **`NEXT_PUBLIC_SITE_URL=https://teslan-staging.up.railway.app`**: zdaj ni nastavljen, zato sitemap, kanonični naslovi, OG slike, povezave v e-pošti in povratni naslovi Stripa kažejo na `http://localhost:8080`.
- [ ] **`BASIC_AUTH_USER` in `BASIC_AUTH_PASSWORD`** (obe hkrati, dolgo naključno geslo): brez njiju je staging odprt vsem. Webhook Stripa je izvzet.
- [ ] **Stripe (testni način)**: `STRIPE_SECRET_KEY` (`sk_test_…`) in `STRIPE_WEBHOOK_SECRET`. V Stripu ustvarite webhook `https://teslan-staging.up.railway.app/api/stripe/webhook` z dogodkoma `checkout.session.completed` in `checkout.session.expired`; njegov *Signing secret* je `STRIPE_WEBHOOK_SECRET`. Do takrat je kartica onemogočena in naročila po pošti ni mogoče oddati.
- [ ] **Resend**: `RESEND_API_KEY` **in hkrati** `EMAIL_REDIRECT_TO` (vaš e-naslov), sicer staging pošilja pravim kupcem. Pred tem v Resendu overite domeno `teslan.si` (DNS zapisi SPF in DKIM v Cloudflare).
- [ ] **Cloudflare R2**: bucket `teslan-staging` z javnim dostopom in API žeton samo zanj; `S3_BUCKET`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL`. Nato v adminu znova naložite slike (do takrat stran kaže testne slike).
- [ ] Po spremembi spremenljivk na Railwayu sprožite *Deploy* in preverite, da se stran odpre (ob zagonu so v logu opozorila za manjkajoče neobvezne nastavitve).

### 2. Staging: admin in preizkus delovanja (S19)

- [ ] **Prvi admin račun**: na `/admin` ustvarite prvega uporabnika (vedno administrator; agenti računov ne ustvarjajo). Ali pa pred deployem nastavite `SEED_ADMIN_EMAIL` in `SEED_ADMIN_PASSWORD`.
- [ ] **Račun urednika za Sandija**: *Nastavitve → Uporabniki → nov*, vloga `urednik` (§11, točka 7).
- [ ] Z R2: v adminu naložite sliko in preverite, da se prikaže na strani izdelka.
- [ ] Z Resendom: oddajte naročilo s prevzemom in preverite, da E1 in E2 prideta na `EMAIL_REDIRECT_TO` z zadevo `[STAGING → …]`.
- [ ] S Stripom: naročilo po pošti s kartico `4242 4242 4242 4242` (poljuben datum v prihodnosti in CVC) in preverite, da je naročilo v adminu *Novo* in *plačano*; nato še eno, ki ga na Stripu prekinete (zaloga se vrne).
- [ ] Preverite omejitev naročil na IP (K7): po šestem naročilu v desetih minutah z istega naslova mora blagajna zavrniti oddajo. Če zavrne že prvo ali nikoli, Railwayev posrednik glave `X-Forwarded-For` ne nastavlja, kot predvideva `src/narocila/omejitev.ts`; javite nam.

### 3. Podatki trgovine in vsebina (admin)

- [ ] *Nastavitve trgovine → Podatki prodajalca*: **naziv, davčna številka, KMG-MID** (in matična številka, če obstaja). Dokler jih ni, pravne strani kažejo `[manjka: …]`.
- [ ] Ista stran: **zemljepisna širina in dolžina** kmetije (Google Maps → desni klik na kmetijo). Brez njiju Google ne dobi lege (JSON-LD `geo`).
- [ ] Preverite *E-pošta za obvestila* (privzeto Sandijev naslov), poštnino, prag brezplačne poštnine in navodila za prevzem.
- [ ] Fotografije izdelkov in škatel, opisi, sestavine, alergeni; pravi tipi darilnih škatel in programi (demo škatle in programa z „[DEMO]“ označite kot neaktivne oz. neobjavljene) (§7).
- [ ] **Zgodbe izdelkov** (*Izdelki → izdelek → Dolg opis*): vsak izdelek iz seeda ima osnutek zgodbe, ki jo je napisal agent. Preberite jih in popravite, kar ne drži ali bi radi povedali drugače; izdelek brez dolgega opisa pokaže kratek opis in splošno besedilo o kmetiji.

### 4. Pregledi (računovodja, pravnik)

- [ ] **Pravna besedila** `/pogoji`, `/odstop`, `/privacyPolicy` so osnutki (na stagingu z oznako „Osnutek – v pregledu“). Odločitve, ki jih je treba potrditi, so naštete v dnevniku K11 spodaj (IRPS, izjeme od odstopa, račun, rok pošiljanja, obdelovalci, hramba). Po spremembi posodobite `POSODOBLJENO` v `src/pravno/podatki.ts`.
- [ ] **DDV stopnje** (seed: 9,5 % za živila, 22 % za škatle in poštnino) in **izdaja računov**: trgovina pošlje potrdilo naročila („To ni račun.“), ne davčno potrjenega računa (načrt P5, §12).
- [ ] Pogodbe o obdelavi podatkov (DPA) s Stripe, Resend, Cloudflare in Railway.

### 5. GitHub in pospravljanje

- [ ] **Izbrišite združene veje** `nacrt/k1-temelji`, `nacrt/k2-identiteta`, `nacrt/k3-payload`, `nacrt/k4-katalog`, `nacrt/k5-izlozba`, `nacrt/k6-kosarica`, `nacrt/k7-blagajna`, `nacrt/k8-stripe`, `nacrt/k10-darila` (vse so v celoti v `staging`; agenti jih niso smeli izbrisati). Ostale veje (`nacrt/spletna-trgovina`, `railway-priprava`, `nav_integ`, `claude/…`) preglejte sami.
- [ ] **Odklopite aplikacijo Vercel** z repozitorija (GitHub → Settings → Integrations → Vercel ali na Vercelu projekt `teslan-app1` → Settings → Git → Disconnect). Na PR-jih dodaja nepotrebno preverjanje; stran gostuje na Railwayu.
- [ ] Neobvezno: GitHub secrets `STRIPE_SECRET_KEY` (testni) in `STRIPE_WEBHOOK_SECRET`, da CI požene S11 s pravim Stripom (gl. *Preskočeni preizkusi*).

### 6. Pred prehodom v produkcijo (§12, PR `staging` → `main` odpre in združi lastnik)

- [ ] Izpolnjeni S1–S20 (stanje spodaj), videz in delovanje na stagingu potrjena, točki 3 in 4 zaključeni.
- [ ] Railway → *production*: Postgres (ali druga produkcijska baza), `DATABASE_URL`, nov `PAYLOAD_SECRET` (drugačen od staginga), `NEXT_PUBLIC_SITE_URL=https://www.teslan.si`, **live** ključa Stripe in webhook `https://www.teslan.si/api/stripe/webhook`, `RESEND_API_KEY`, R2 bucket `teslan-prod` (`S3_*`), po želji `SEED_ADMIN_*`.
- [ ] V produkciji **ni** `NOINDEX`, `BASIC_AUTH_*`, `EMAIL_REDIRECT_TO`, `STRIPE_API_URL`, `EPOSTA_DNEVNIK`, `OMEJITEV_NAROCIL_NA_IP`, `TESTNE_SLIKE`.
- [ ] Produkcijska baza migrirana in seedana (`npm run pripravi-bazo` z produkcijskim `DATABASE_URL`, če Railway ukaza pred deployem ne izvede), Sandi ima račun urednika.
- [ ] Po izdaji: testno naročilo z majhnim zneskom, vračilo v Stripu, preklic v adminu; v Google Search Console oddajte `https://www.teslan.si/sitemap.xml`.

## Stanje sprejemnih kriterijev (po K13)

| S | Stanje | Kje / kaj manjka |
|---|---|---|
| S1 | izpolnjen ob zelenem CI na `staging` po združitvi K13 | `.github/workflows/ci.yml` (typecheck, Payload, lint, Vitest, Playwright) |
| S2–S5 | izpolnjeni | enotski testi `src/kosarica/cene.test.ts`, `src/katalog/sezona.test.ts`, `src/narocila/statusi.test.ts` |
| S6–S8 | izpolnjeni | integracijski testi `src/narocila/*.int.test.ts` |
| S9, S10, S15 | izpolnjeni | `e2e/blagajna.spec.ts`, `e2e/zaprta/trgovina.spec.ts` |
| S11 | z nadomestnim Stripom | `e2e/placilo.spec.ts`; s pravim Stripom `e2e/stripe-pravi.spec.ts`, ko so v CI testni ključi |
| S12–S14 | izpolnjeni | `e2e/darila.spec.ts`, `e2e/admin.spec.ts`, `e2e/katalog.spec.ts` |
| S16 | izpolnjen v e2e | `e2e/noindex/zascita.spec.ts`; na stagingu šele z `NOINDEX=1` in `BASIC_AUTH_*` (točka 1) |
| S17 | izpolnjen | `e2e/dostopnost.spec.ts` (vse javne strani, namizje in mobilno) |
| S18 | gl. dnevnik K13 | Lighthouse (mobilno) na stagingu za `/` in `/products` |
| S19 | delno | deploy, migracije in seed delujejo; manjkajo admin račun, R2, Resend in Stripe (točki 1 in 2) |
| S20 | izpolnjen | brez `slick`/`classnames`, brez `src/data/`, README opisuje zagon, okolja, seed, deploy in predajo |

## Manjkajoči ključi in nastavitve

| Kaj | Potrebno od | Nadomestek do takrat | Kje nastaviti |
|---|---|---|---|
| `DATABASE_URL` (Railway Postgres za staging) | K3 | **brez nadomestka na stagingu**: strežnik se ne zažene, `npm run migrate` pred deployem pade (lokalno in v CI Postgres v Dockerju) | Railway → staging → dodajte Postgres, spremenljivko povežite s storitvijo |
| `PAYLOAD_SECRET` (staging) | K3 | **brez nadomestka na stagingu**: strežnik se ne zažene | Railway → staging → Variables (`openssl rand -hex 32`) |
| `S3_BUCKET`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL` (R2 `teslan-staging`) | K3 | lokalni disk (`media/`); na Railwayu se slike ob vsakem deployu izgubijo | Cloudflare R2 + Railway → staging → Variables |
| `STRIPE_SECRET_KEY` (testni `sk_test_…` za staging), `STRIPE_WEBHOOK_SECRET` | K8 | brez njiju je plačilo s kartico na blagajni onemogočeno, zato tudi pošiljanje po pošti (samo kartica, Z22); prevzem s plačilom ob prevzemu deluje | Stripe → Developers → API keys; Webhooks → endpoint `https://<staging>/api/stripe/webhook` z dogodki `checkout.session.completed`, `checkout.session.expired` (neobvezno še `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`) → Signing secret; oboje v Railway → staging → Variables |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` (staging) | K4 | brez njiju seed administratorja ne ustvari; prvega uporabnika (vedno administrator) ustvarite na `/admin` | Railway → staging → Variables (geslo vsaj 12 znakov) |
| `RESEND_API_KEY` (staging in produkcija) | K9 | brez ključa se vsa e-pošta (E1–E5, pozabljeno geslo v adminu) izpiše v log strežnika na Railwayu in **kupcem ne pride** | Resend → račun, *Domains* → dodajte `teslan.si` in DNS zapise (SPF, DKIM, po želji DMARC) v Cloudflare; ko je domena overjena, *API Keys* → ključ s pravico *Sending access* → Railway → Variables |
| `EMAIL_REDIRECT_TO` (samo staging) | K9 | ni potreben, dokler ni `RESEND_API_KEY`; **s ključem na stagingu brez njega dobijo e-pošto pravi naslovi**, zato ga nastavite hkrati s ključem | Railway → staging → Variables: vaš e-naslov |
| `EMAIL_FROM` (neobvezno) | K9 | privzeto `Domačija Tešlan <narocila@teslan.si>` | Railway → Variables, če želite drug naslov (mora biti na overjeni domeni) |
| `BASIC_AUTH_USER`, `BASIC_AUTH_PASSWORD` (samo staging) | K12 | **staging je brez gesla dostopen vsem** (iskalniki ga zaradi `NOINDEX=1` ne indeksirajo); ob zagonu je v logu opozorilo. Geslo se vklopi šele, ko sta nastavljeni **obe**; ena sama strani ne zaklene, le izpiše opozorilo | Railway → staging → Variables: obe hkrati (npr. `teslan` in dolgo naključno geslo), nato *Deploy*. V produkciji ju ne nastavljajte |
| `NEXT_PUBLIC_SITE_URL` (staging in produkcija) | K12 (prej K7–K9) | brez nje kanonični naslovi, sitemap, OG slike in JSON-LD kažejo na `localhost`; ob zagonu v produkciji je opozorilo v logu | Railway → Variables: staging URL oz. `https://www.teslan.si` |

## Preskočeni preizkusi

| Preizkus | Razlog | Kaj ga omogoči |
|---|---|---|
| Nalaganje slik v R2 (Z83, S19) | ni R2 ključev; testi preverijo lokalni disk in sestavo javnega URL-ja | R2 bucket in `S3_*` na stagingu, ročni preizkus v adminu (K13) |
| S11 s pravim Stripom (`e2e/stripe-pravi.spec.ts`: kartica 4242 4242 4242 4242, prekinitev) | ni testnih ključev Stripe; isti tok (blagajna → Checkout → podpisan webhook → potrdilo, prekinitev) preveri `e2e/placilo.spec.ts` z nadomestnim Stripom (`e2e/stripe-nadomestek.ts`), logiko pa integracijski testi (S8) | GitHub secrets `STRIPE_SECRET_KEY` (testni) in `STRIPE_WEBHOOK_SECRET` (poljuben `whsec_…`, ali iz `stripe listen`) ter ju dodati v okolje koraka Playwright v `.github/workflows/ci.yml`; lokalno: ključa v okolju pred `npm run test:e2e` |
| Testno kartično naročilo prek webhooka na stagingu (S19) | ni Stripe računa in webhooka za staging | ključa in webhook zgoraj, nato ročni preizkus (K13) |
| Pošiljanje prek pravega Resenda (`src/eposta/adapter.test.ts`, „Resend s pravim ključem“) in prejem e-pošte na `EMAIL_REDIRECT_TO` na stagingu (S19) | ni ključa Resend; zahtevo za Resend (naslov, glava, telo, napaka) preveri test z nadomestnim `fetch`, vsebino predlog in sprožitev ob statusih enotski in integracijski testi, e2e pa e-pošto iz dnevnika | `RESEND_API_KEY` v okolju pred `npm test` (pošlje eno sporočilo na `delivered@resend.dev`); na stagingu ključ in `EMAIL_REDIRECT_TO`, nato testno naročilo (K13) |

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
- **Testne slike (po K11):** dokler na stagingu ni R2, stran namesto manjkajoče datoteke pokaže isto sliko iz `public/` ali testno fotografijo kmetije (alt se konča s „(testna slika)“), izdelki, skupine, škatle in programi brez slike pa dobijo testno sliko (`src/katalog/testne-slike.ts`). Z R2 se to samodejno izklopi; po nastavitvi R2 je treba slike naložiti znova, sicer okvirji ostanejo prazni ali kažejo nadomestno ploskev.
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

### K9 E-pošta
- Novi spremenljivki za staging: `RESEND_API_KEY` in `EMAIL_REDIRECT_TO` (gl. tabelo zgoraj). **Ključ in preusmeritev nastavite hkrati**, sicer staging pošilja pravim kupcem. V produkciji `EMAIL_REDIRECT_TO` ne sme biti nastavljen.
- Dokler ključa ni, se vsaka e-pošta izpiše v log strežnika (Railway → Deployments → Logs, vrstica „E-pošta ni poslana (RESEND_API_KEY ni nastavljen)“). Naročila delujejo normalno.
- Pošiljatelj je `narocila@teslan.si`: v Resendu morate overiti domeno `teslan.si` (DNS zapisi v Cloudflare). Odgovori kupcev gredo na *E-pošta za obvestila* v nastavitvah trgovine (privzeto Sandijev naslov).
- Obvestila: E1 kupcu in E2 prodajalcu ob novem naročilu, E3 ob „Pripravljeno za prevzem“, E4 ob „Poslano“ (s številko pošiljke, če jo vpišete pred shranjevanjem), E5 ob „Preklicano“ (z razlogom preklica, če ga vpišete; pri plačilu s kartico „Znesek vrnemo na kartico v nekaj delovnih dneh.“). „Zaključeno“ ne pošlje ničesar, prav tako preklic naročila, ki še čaka na plačilo s kartico.
- Če pošiljanje ne uspe, se naročilo ali sprememba statusa vseeno shrani; napaka je v adminu pri naročilu (*Tehnični podatki → Napaka pri pošiljanju e-pošte*) in v logu. Kupca tedaj obvestite sami.
- Besedila e-pošte so v `src/eposta/narocila.ts` (vikanje). Videz preverite na stagingu, ko je Resend nastavljen.
- Preskočen preizkus: pošiljanje s pravim ključem (gl. tabelo preskočenih preizkusov).

### K10 Darila
- Ni novih zunanjih ključev in ni preskočenih preizkusov. E2E test darila po pošti na naslov prejemnika (`e2e/darila.spec.ts`, Z55) plača z nadomestnim Stripom; s pravimi ključi se preskoči kot ostali testi z nadomestkom.
- K9 (e-pošta) je bil po odločitvi lastnika preskočen do naslednjega dne, zato K10 uporablja obstoječi dnevniški adapter (`src/eposta/dnevnik.ts`): vsebina škatle, sporočilo na kartici (E2) in oznaka darila ter naslov prejemnika (E2) so dodani v besedilni različici obvestil E1/E2. K9 jih mora prenesti v HTML predloge.
- Ob prvem deployu po K10 seed (`seed:if-empty`) na stagingu doda demo darila (malo in veliko škatlo, programa „Okusi Dolenjske“ in „Za kuharje“, opisi z „[DEMO]“), ker v bazi še ni nobene škatle in nobenega programa. Kasneje izbrisanih daril ne vrne; če jih ne želite, škatlo označite kot neaktivno ali program kot neobjavljen.
- Lastnik v adminu (*Darila*) vnese prave tipe škatel (slike, cene, zalogo) in programe. Velikost izdelka v programu se vpiše z oznako (npr. „41 ml (15 g)“) ali pusti prazna za prvo velikost.
- Slike škatel v demo podatkih niso nastavljene (ni fotografij); stran pokaže nadomestno ploskev z ikono darila.

### K11 Pravne strani
- Ni novih zunanjih ključev in ni preskočenih preizkusov.
- Nove strani `/pogoji` (splošni pogoji poslovanja), `/odstop` (odstop od pogodbe z obrazcem za kopiranje) in posodobljena `/privacyPolicy` so **osnutki** po ZVPot-1 in GDPR. Na stagingu (`NOINDEX=1`) imajo na vrhu obvestilo „Osnutek – v pregledu“; v produkciji ga ni, zato morata **lastnik in računovodja/pravnik besedila pregledati pred prehodom v produkcijo** (§12).
- **Podatki prodajalca**: v *Nastavitve trgovine → Podatki prodajalca* vnesite naziv, davčno številko in KMG-MID (ter matično številko, če obstaja). Dokler niso vpisani, pravne strani na teh mestih kažejo `[manjka: …]`. Matična številka ni obvezna in se brez vpisa ne prikaže.
- Odločitve v osnutku, ki jih mora lastnik potrditi:
  - **Izvensodno reševanje sporov (IRPS)**: pogoji navajajo, da prodajalec ne priznava nobenega izvajalca IRPS. Če kmetija izvajalca izbere, je treba besedilo v `src/app/(frontend)/pogoji/page.tsx` (poglavje 12) popraviti. Povezave na evropsko platformo za spletno reševanje sporov (SRPS/ODR) ni, ker je platforma od julija 2025 ukinjena.
  - **Izjeme od odstopa**: hitro pokvarljivo blago (sveža zelenjava, sadje, jajca), živila, ki jih kupec po dobavi odpre, in sestavljene darilne škatle s sporočilom na kartici. Škatle brez sporočila in neodprti izdelki imajo pravico do odstopa.
  - **Račun**: pogoji pravijo, da potrdilo naročila ni račun in da račun izda prodajalec v skladu s predpisi (način izdaje določi računovodja).
  - **Rok pošiljanja**: „praviloma v nekaj delovnih dneh, najpozneje v 30 dneh“. Če želite konkreten rok, ga vpišite v poglavje 6 pogojev.
  - **Obdelovalci**: Stripe (Irska), Resend, Cloudflare in Railway (ZDA) s prenosom na podlagi okvira EU-ZDA oz. standardnih pogodbenih klavzul. Lastnik preveri, da ima s ponudniki sprejete pogodbe o obdelavi (DPA), ki so običajno del njihovih pogojev.
  - **Hramba**: podatki o naročilih praviloma 10 let po koncu leta izdaje računa (davčni predpisi).
- Datum zadnje posodobitve na straneh je konstanta `POSODOBLJENO` v `src/pravno/podatki.ts`; ob vsaki vsebinski spremembi ga posodobite.

### K12 SEO in zaščita staginga
- Ni preskočenih preizkusov. Zaščito (S16) preverja e2e na strežniku, ki posnema staging (`NOINDEX=1` in testno geslo iz `e2e/zascita.ts`).
- **Geslo za staging**: nastavite `BASIC_AUTH_USER` in `BASIC_AUTH_PASSWORD` v Railway → staging → Variables (gl. tabelo zgoraj). Brskalnik ob prvem obisku vpraša za ime in geslo. Stripe webhook (`/api/stripe/webhook`) je izvzet, zato ga Stripe doseže brez gesla. Če boste na Railwayu kdaj vklopili *Healthcheck Path*, bo zaradi gesla dobival 401; v tem primeru geslo začasno odstranite ali nam javite, da dodamo izjemo.
- **Lega kmetije za Google** (JSON-LD `geo`): v *Nastavitve trgovine → Podatki prodajalca* vpišite zemljepisno širino in dolžino (Google Maps → desni klik na kmetijo → klik na številki ju kopira). Dokler polji nista izpolnjeni, se lega ne objavi; ostali podatki (ime, naslov, telefon, e-pošta) se že objavijo iz nastavitev. Na stagingu po deployu zaženite migracijo `20261110_110028_seo_lega` (`deploy-staging.sh`).
- Privzeta slika za deljenje na družbenih omrežjih je `public/og.jpg` (izrez fotografije nasada jagod 1200 × 630). Podstran izdelka deli prvo sliko izdelka. Če želite drugo privzeto sliko, zamenjajte datoteko z enako velikostjo.
- Pred prehodom v produkcijo preverite, da v produkciji **nista** nastavljena `NOINDEX` in `BASIC_AUTH_*` (§12) in da je `NEXT_PUBLIC_SITE_URL=https://www.teslan.si`; nato v Google Search Console oddajte `https://www.teslan.si/sitemap.xml`.

### K13 Kakovost in predaja
- Ni novih zunanjih ključev in ni novih preskočenih preizkusov. Kontrolni seznam na vrhu tega dokumenta je dokončan.
- **Pregled stagina (2026-11-10)**: nastavljeni sta samo `DATABASE_URL` in `PAYLOAD_SECRET`. Manjkata tudi `NOINDEX=1` (staging je zdaj odprt za iskalnike) in `NEXT_PUBLIC_SITE_URL` (sitemap kaže na `http://localhost:8080`); oboje je v točki 1 seznama.
- **Dostopnost (S17)**: `e2e/dostopnost.spec.ts` (axe z vsemi pravili na vseh javnih straneh, namizje in mobilno). Popravljeno: neobstoječe poti so vračale privzeto stran 404 brez jezika in glavne regije (zdaj `src/app/global-not-found.tsx`), tabela piškotkov na politiki zasebnosti na ozkem zaslonu ni bila dosegljiva s tipkovnico.
- **Hitrost (S18)**: Lighthouse (mobilno) na stagingu pred K13: `/` Performance 76, `/products` 78 (Accessibility, Best practices in SEO 100). Zavirali so štiri datoteke pisav (425 KB) pred glavno sliko, polni Framer Motion in zod v začetnem JavaScriptu ter slike v WebP. Po popravkih lokalno na isti gradnji: `/` 88–89, `/products` 92, podstran izdelka 90, `/about` 92, `/darila` 86; ostale kategorije 100. Rezultat na stagingu po deployu K13 je zapisan v PR K13.
- **Pisavi** sta od K13 v repu (`src/app/(frontend)/pisave/`, licenca OFL) namesto iz `next/font/google`: Google Fonts ne omogoča zamrznitve osi SOFT in podmnožice samo s šumniki, kar je skupaj prepolovilo velikost. Videz je enak (iste osi in rezi). Skripta `scripts/pripravi-pisave.sh` ju pripravi znova.
- Lighthouse na stagingu z vklopljenim `NOINDEX=1` pri SEO namenoma izgubi točke (stran je označena za neindeksiranje); SEO preverjajte brez njega ali v produkciji.

### UI popravki po pregledu lastnika (2026-11-10)
- Ni novih zunanjih ključev in ni novih preskočenih preizkusov.
- Podatkovna migracija `20261110_140000_zgodbe_izdelkov` vpiše osnutke zgodb izdelkom brez dolgega opisa in popravi kratek opis jagod (ne trdi več „brez pesticidov“). Na stagingu jo zažene `deploy-staging.sh`.
- Admin je na `/admin`; v nogi je diskretna povezava „Urejanje trgovine“.
