# Načrt: prenova strani in spletna trgovina Domačije Tešlan

Stanje: **pripravljen za izvedbo**. Izvaja avtonomni sistem agentov brez vprašanj lastniku.
Lastnik repa: Blaž (GitHub `BlazBracko`). Uporabnik admina „urednik“: Sandi Derčar (nosilec kmetije).
Datum: 2026-11-09.

---

## 0. Izhodišče (stanje repa ob pisanju)

- Next.js 16.2.3, React 19, TypeScript, Tailwind 4, Framer Motion. Brez backenda.
- Strani: `/`, `/products` (cenik 23 vrstic), `/about`, `/privacyPolicy`.
- Podatki statično v `src/data/` (`priceList.ts`, `products.ts`, `offering.ts`, `availability.ts`, `contact.ts`).
- Gostovanje: Railway. Produkcija iz `main`, staging iz `staging` (veji sta ob pisanju enaki). DNS na Cloudflare, domena `www.teslan.si` (apex preusmerja na `www` v `next.config.ts`).
- Brez testov, brez CI. `navodila.md` je **zastarel** (opisuje odstranjeno animacijo) in ni vir resnice.

## 1. Cilj in zakaj

Kmetija dobi:
1. **Novo spletno stran z novo identiteto**, ki pokaže celotno ponudbo in znamko Tešlan.
2. **Spletno trgovino**: kupec naroči izdelke za prevzem na kmetiji ali po pošti in plača s kartico ali ob prevzemu.
3. **Konfigurator darilnih škatel**: kupec sestavi darilo iz izdelkov v škatli in ga pošlje sebi ali prejemniku.
4. **Admin za Sandija**: sam ureja izdelke, cene, velikosti, zalogo, slike, darila in naročila brez kode.

Lastnik bo po izdaji na staging z demo podatki iterativno izboljševal, zato je prioriteta celovit, delujoč sistem na stagingu in ne končna vsebina.

## 2. Obseg

### Notri
- Popolna prenova UI in vizualne identitete (razen logotipa), knjižnica komponent.
- Payload CMS 3 v isti Next aplikaciji, Postgres, admin na `/admin`.
- Katalog: vsi izdelki prikazani, vsak ima enega od treh načinov prodaje in eno ali več velikosti.
- Košarica, blagajna, naročila, Stripe Checkout, plačilo ob prevzemu, zaloga s rezervacijo.
- Darilne škatle: tipi škatel z mesti, pripravljeni programi (predloge), lastna sestava, sporočilo na kartici, naslov prejemnika.
- E-poštna obvestila prek Resend.
- Pravne strani (osnutki): splošni pogoji, odstop od pogodbe, posodobljena politika zasebnosti.
- SEO: sitemap, robots, OG slike, JSON-LD, metadataBase, noindex in zaščita staginga.
- Pospravljanje kode, testi (Vitest, Playwright), CI.
- Seed z demo podatki (pravi cenik + demo darila), staging postavitev.

### NI notri (izrecno)
- Uporabniški računi kupcev, prijava kupcev, zgodovina naročil za kupce.
- Izdaja (davčno potrjenih) računov, povezava s FURS ali programom za račune. Trgovina pošlje **potrdilo o naročilu**, ne računa.
- Samodejna vračila prek Stripe API (vrača Sandi ročno v Stripe nadzorni plošči).
- Plačilo po povzetju, bančno nakazilo, PayPal.
- Dostava izven Slovenije, dostava s kmetijsko vozilom, izbira prevzemnih terminov.
- Darilni boni, kode za popust, želeni datum dostave darila.
- Analitika, piškotna pasica (stran uporablja samo nujne piškotke, gl. Z60).
- Večjezičnost (samo slovenščina, valuta EUR).
- Galerija kot samostojna stran.
- Spreminjanje obstoječih URL-jev (`/products`, `/about`, `/privacyPolicy` ostanejo). Nove strani dobijo slovenske poti.
- Spajanje v `main` / izdaja v produkcijo (to naredi lastnik, gl. §12).

## 3. Izrecne predpostavke

Lastnik jih ni potrdil posebej, zato jih je izbral načrtovalec. Vse so dovoljeno izhodišče in jih ni treba ponovno preverjati.

| # | Predpostavka |
|---|---|
| P1 | Preklic: Sandi prekliče v adminu → zaloga se vrne, kupec dobi e-pošto. Kartično plačilo Sandi vrne ročno v Stripu. Kupec na strani ne more preklicati. |
| P2 | Kategorija „Jajca“ (tudi vložena prepeličja jajca), šparglji in redkvica so `samo-prevzem`. Vsi ostali izdelki s cenika so `posta-in-prevzem`. |
| P3 | „Bučno / olivno olje“ se razdeli na dva izdelka z enakima cenama (1 L 20,00 €, 0,5 L 12,00 €). |
| P4 | Sveže jagode, svež česen, krompir se dodajo kot `samo-prikaz` brez cene (sezone: jagode 5–7, česen 9–10, krompir 8–10). |
| P5 | Stopnja DDV: vsa živila 9,5 %, darilna škatla 22 %, poštnina 22 %. Seed tako nastavi; računovodja potrdi pred produkcijo. |
| P6 | V darilno škatlo smejo le izdelki z `primernoZaDarilo = true`, kar je dovoljeno samo pri `posta-in-prevzem`. Zato je vsaka škatla primerna za pošto. |
| P7 | Škatla ima vsaj 1 izdelek in največ toliko kosov, kot ima mest (1 kos = 1 mesto). Ni treba, da je polna. |
| P8 | Cena škatle = cena tipa škatle + vsota cen izbranih izdelkov. Zaloga se zmanjša za tip škatle in vsak izdelek. |
| P9 | Na stagingu gredo vse e-pošte na en naslov (`EMAIL_REDIRECT_TO`), prvotni prejemnik je v zadevi. |
| P10 | Rezervacija zaloge ob oddaji naročila; neplačana kartična naročila potečejo po 30 min in vrnejo zalogo. |
| P11 | Neprevzeta naročila „ob prevzemu“ Sandi prekliče ročno; ni samodejnega izteka. |
| P12 | Seed zaloga: 20 kosov na velikost in 20 kosov na tip škatle. |

## 4. Uporabniški tokovi

### T1 Ogled ponudbe
1. Obiskovalec pride na `/`, vidi znamko, sezonsko ponudbo, skupine ponudbe, darila in kontakt.
2. Gre na `/products`, filtrira po kategoriji, vidi vse objavljene izdelke z oznako razpoložljivosti in načinom prodaje.
3. Odpre `/products/[slug]`: slike, opis, izbira velikosti, cena, zaloga.

### T2 Nakup za prevzem, plačilo ob prevzemu
1. Na podstrani izdelka izbere velikost in količino → „V košarico“. Ikona košarice v glavi pokaže število kosov.
2. `/kosarica`: spremeni količine, odstrani, vidi vmesni seštevek → „Na blagajno“.
3. `/blagajna`: ime, priimek, e-pošta, telefon; dostava „Prevzem na kmetiji“; plačilo „Ob prevzemu“; opomba (želeni termin prevzema); obkljuka pogoje → „Oddaj naročilo“.
4. Preusmeritev na `/narocilo/[stevilka]?k=<žeton>`: potrdilo. Kupec dobi E1, Sandi E2.
5. Sandi v adminu nastavi status „Pripravljeno za prevzem“ → kupec dobi E3 (naslov, pot, telefon).
6. Ob prevzemu Sandi nastavi „Zaključeno“.

### T3 Nakup po pošti s kartico
1. Košarica vsebuje le izdelke `posta-in-prevzem` in/ali darilne škatle.
2. `/blagajna`: dostava „Pošta“ → obvezen naslov (ulica s hišno številko, poštna številka, kraj). Plačilo je samo „Kartica“. Poštnina se prišteje (0 € nad pragom).
3. „Na plačilo“ → Stripe Checkout (sl, EUR). Uspeh → `/narocilo/...`, status „Novo“, plačano. E1 + E2.
4. Prekinitev na Stripu → vrnitev na `/blagajna?preklic=1`, seja se takoj izteče, zaloga se vrne, košarica ostane.
5. Sandi odda paket, nastavi „Poslano“ (neobvezna številka pošiljke) → E4.

### T4 Mešana košarica
- Če košarica vsebuje vsaj en `samo-prevzem` izdelek, je pošta onemogočena z razlago, kateri izdelki to povzročajo.

### T5 Darilna škatla
1. `/darila`: seznam pripravljenih programov + „Sestavi svoje darilo“.
2. Izbira programa → konfigurator `/darila/sestavi?program=<slug>` z vnaprej izpolnjeno vsebino; ali `/darila/sestavi` z izbiro tipa škatle.
3. Konfigurator: izbira tipa škatle (prikaz mest), dodajanje/odstranjevanje izdelkov (le primerni, na zalogi, v sezoni), prazna mesta vidna, sprotna cena, sporočilo na kartici (≤ 300 znakov, neobvezno) → „V košarico“.
4. V košarici je škatla ena postavka z vsebino; urejanje odpre konfigurator z njeno vsebino.
5. Na blagajni, če je dostava pošta in košarica vsebuje škatlo: možnost „Pošlji na naslov prejemnika“ (ime prejemnika + naslov). Na naročilu je oznaka „Darilo – potrdila/cene ne prilagaj paketu“.

### T6 Sandi ureja ponudbo
1. Prijava na `/admin` (e-pošta + geslo).
2. Ureja izdelke (velikosti, cene, zaloge, slike, način prodaje, sezona, darilo), kategorije, skupine ponudbe, tipe škatel, programe.
3. Spremembe so na strani vidne v ≤ 60 s brez novega deploya.

### T7 Sandi obdeluje naročila
- Seznam naročil, filtriran po statusu, privzeto najnovejša zgoraj; stolpci: številka, datum, kupec, dostava, plačilo, plačano, skupaj, status.
- Sprememba statusa sproži ustrezno e-pošto. Preklic vrne zalogo.

## 5. Funkcionalne zahteve

### Identiteta in UI
- **Z1** Nova vizualna identiteta: paleta (barvni tokeni), tipografija (največ 2 družini prek `next/font/google`, obe s `latin-ext`), radiji, sence, razmiki, gibanje. Ohrani se samo logotip (`public/logo.png`). Vse definirano kot Tailwind 4 `@theme` tokeni v `globals.css`; v komponentah ni surovih hex vrednosti.
- **Z2** Oblikovno vodilo: `.claude/skills/apple-design/SKILL.md` (umirjeno, velike fotografije, jasna tipografija, fluidne, prekinljive animacije). Mobile-first. Nakupni tok (košarica, blagajna, potrdilo) brez okrasnih animacij.
- **Z3** Knjižnica komponent v `src/components/ui/`: lastne komponente na Tailwindu; interaktivni deli (dialog, sheet, radio group, select, toast, tabs) na Radix primitivih. Brez shadcn/ui in brez drugih UI ogrodij.
- **Z4** Stran `/styleguide` (samo ko `NOINDEX=1`, sicer 404) prikaže barve, tipografijo in vse komponente v vseh stanjih.
- **Z5** Vse strani (obstoječe in nove) so na novo zgrajene v novem sistemu. Vsebinsko ostanejo: domača, izdelki, o nas, zasebnost.
- **Z6** Dostopnost: WCAG 2.2 AA kontrast, vidni fokus, celotna stran upravljiva s tipkovnico, `prefers-reduced-motion` izklopi neesencialne animacije, vse slike imajo `alt`.
- **Z7** Glava: logotip, Domov, Izdelki, Darila, O nas, ikona košarice s številom kosov (posodobi se takoj). Mobilni meni kot Radix dialog/sheet.
- **Z8** Noga: kontakt, naslov s povezavo na zemljevid, povezave na Splošne pogoje, Odstop od pogodbe, Politiko zasebnosti.

### Katalog
- **Z10** Vsak izdelek ima natanko en način prodaje: `posta-in-prevzem`, `samo-prevzem`, `samo-prikaz`.
- **Z11** Vsak izdelek ima ≥ 1 velikost (oznaka, cena v centih, zaloga). Pri `samo-prikaz` sta cena in zaloga neobvezni in se ne prikazujeta kot naročljivi.
- **Z12** Izdelek s sezono je naročljiv le v mesecih sezone (časovni pas `Europe/Ljubljana`, sezona lahko prelije čez novo leto). Mesec pred začetkom: oznaka „Kmalu“.
- **Z13** Razpoložljivost velikosti: naročljiva, če način ≠ `samo-prikaz`, je v sezoni in zaloga > 0. Oznake: „Na zalogi“, „Še N kosov“ (pri zalogi ≤ 3), „Ni na zalogi“, „Kmalu“, „Sezona <mesec> — <mesec>“, „Samo prevzem na kmetiji“, „Na voljo na kmetiji“ (`samo-prikaz`).
- **Z14** `/products`: vsi objavljeni izdelki, filter po kategoriji (stanje v URL `?kategorija=<slug>`), kartica z najnižjo ceno „od X €“ in oznako. Neobjavljeni izdelki niso vidni nikjer.
- **Z15** `/products/[slug]`: galerija (≥ 0 slik, brez slike nadomestna ploskev), kratek in dolg opis, sestavine/alergeni če vpisani, izbira velikosti (radio), količina (1 do min(zaloga, 20)), „V košarico“. Neobstoječ ali neobjavljen slug → 404.
- **Z16** Domača stran prikazuje skupine ponudbe iz CMS (ime, opis, slika, „od X €“ izračunano iz naročljivih velikosti) in izpostavljene izdelke (polje `izpostavljen`).
- **Z17** Spremembe v adminu so na javnih straneh vidne v ≤ 60 s (on-demand revalidacija prek `afterChange` hookov + `revalidate = 60` kot varovalka).

### Košarica in blagajna
- **Z20** Košarica je shranjena v `localStorage` (samo id-ji, velikosti, količine, vsebina škatel, sporočilo). Cene in razpoložljivost se vedno izračunajo na strežniku iz baze.
- **Z21** Ob odprtju košarice/blagajne strežnik preveri postavke; nedosegljive ali spremenjene so označene z razlogom in jih ni mogoče oddati, dokler jih kupec ne odstrani/popravi.
- **Z22** Pošta je dovoljena le, če so vse postavke `posta-in-prevzem` ali darilne škatle. Pošta → plačilo samo kartica. Prevzem → kartica ali ob prevzemu.
- **Z23** Poštnina: pri pošti `postnina` iz nastavitev (privzeto 500 c), 0 če je vmesni seštevek ≥ `pragBrezplacnePostnine` (privzeto 5000 c). Pri prevzemu 0.
- **Z24** Cene so z DDV. Potrdilo izkaže DDV po stopnjah: `ddv = bruto − round(bruto / (1 + stopnja))`, računano na vsoto postavk iste stopnje, zaokroženo na cent.
- **Z25** Obrazec blagajne: ime, priimek, e-pošta, telefon (obvezni); pri pošti ulica s hišno št., poštna številka (4 števke), kraj; opomba ≤ 500 znakov; obvezna potrditev splošnih pogojev s povezavo; povezava na politiko zasebnosti. Validacija z Zod na odjemalcu in strežniku.
- **Z26** Zaščita pred zlorabo: skrito polje (honeypot) in omejitev 5 naročil / 10 min na IP (v pomnilniku, ena instanca).
- **Z27** Trgovina ima stikalo `trgovinaOdprta` v nastavitvah. Ko je izklopljeno, je katalog viden, gumbi za nakup pa so zamenjani z obvestilom, blagajna zavrne naročila.

### Naročila in zaloga
- **Z30** Oddaja naročila v eni DB transakciji: preveri zaloge vseh velikosti in tipov škatel, jih zmanjša, ustvari naročilo s posnetkom imen, velikosti, cen in stopenj DDV. Ob premajhni zalogi transakcija ne spremeni ničesar, kupec dobi seznam problematičnih postavk.
- **Z31** Številka naročila `T-<leto>-<zaporedna 4-mestna>` (npr. `T-2026-0001`), zaporedje po letu, unikatna.
- **Z32** Vsako naročilo ima naključen žeton (≥ 32 znakov). `/narocilo/[stevilka]` brez pravilnega `k` → 404.
- **Z33** Statusi: `caka-placilo`, `novo`, `pripravljeno` (za prevzem), `poslano` (pošta), `zakljuceno`, `preklicano`. Dovoljeni prehodi: caka-placilo→novo|preklicano; novo→pripravljeno|poslano|preklicano; pripravljeno→zakljuceno|preklicano; poslano→zakljuceno. Drugi prehodi so v adminu zavrnjeni z napako.
- **Z34** Preklic vrne zalogo natanko enkrat (idempotentno), ne glede na število shranjevanj.
- **Z35** Naročila ni mogoče izbrisati (niti admin); popraviti je mogoče le status, številko pošiljke in interno opombo.

### Plačila (Stripe)
- **Z40** Kartično plačilo prek Stripe Checkout (gostovana stran), `mode: payment`, `currency: eur`, `locale: sl`, samodejni načini plačila (kartice, Apple Pay, Google Pay), postavke vključno s poštnino, `metadata.orderId`, `expires_at` = zdaj + 30 min.
- **Z41** Webhook `/api/stripe/webhook` s preverjanjem podpisa: `checkout.session.completed` → `placano=true`, status `novo`, E1+E2; `checkout.session.expired` → status `preklicano` (razlog „neplačano“), zaloga vrnjena, brez e-pošte. Obdelava idempotentna (ponovljen dogodek ne spremeni ničesar).
- **Z42** Vrnitev s preklicem na Stripu takoj izteče sejo (Stripe API `expire`) → isto kot `expired`.
- **Z43** Plačilo ob prevzemu: status takoj `novo`, `placano=false`, E1+E2. Sandi ob prevzemu označi `placano` in `zakljuceno`.

### Darila
- **Z50** Tip škatle: ime, opis, slika, število mest (≥ 1), cena, zaloga, aktiven.
- **Z51** Program: ime, slug, opis, slika, tip škatle, vsebina (izdelek, velikost, količina), objavljen. Validacija ob shranjevanju: vsota količin ≤ mest; vsi izdelki `primernoZaDarilo`.
- **Z52** `primernoZaDarilo` je mogoče nastaviti samo pri `posta-in-prevzem` (validacija v adminu).
- **Z53** Konfigurator velja P7/P8; ne dovoli izdelkov izven sezone, brez zaloge ali neprimernih; program z nedosegljivo postavko se odpre z odstranjeno postavko in obvestilom.
- **Z54** Sporočilo na kartici ≤ 300 znakov, shranjeno na postavki naročila, vidno v adminu in E2.
- **Z55** Naslov prejemnika (ime, ulica, poštna št., kraj) le pri pošti in košarici s škatlo; ko je izbran, je naslov dostave naslov prejemnika, naročilo dobi oznako `darilo=true`.

### E-pošta (Resend)
- **Z56** Pošiljatelj `EMAIL_FROM` (npr. `Domačija Tešlan <narocila@teslan.si>`), odgovor na `emailObvestil` iz nastavitev.
- **Z57** Predloge (HTML + besedilna različica, slovensko): E1 potrdilo kupcu (številka, postavke z velikostmi in vsebino škatel, DDV po stopnjah, poštnina, skupaj, dostava, plačilo, navodila za prevzem ali naslov, povezava na `/narocilo/...`, opomba „To ni račun.“); E2 novo naročilo Sandiju (vse + sporočilo na kartici + povezava v admin); E3 pripravljeno za prevzem (naslov, Google Maps pot, telefon); E4 poslano (številka pošiljke, če vpisana); E5 preklicano (pri plačanem s kartico: „Znesek vrnemo na kartico v nekaj delovnih dneh.“).
- **Z58** Če `RESEND_API_KEY` ni nastavljen, se e-pošta izpiše v log (razvoj, testi). Če je nastavljen `EMAIL_REDIRECT_TO`, gre vsa pošta tja, zadeva dobi predpono `[STAGING → <prvotni prejemnik>]`.
- **Z59** Napaka pri pošiljanju ne razveljavi naročila; zabeleži se v log in na naročilu (`napakaEposte`).

### Pravno, piškotki
- **Z60** Stran uporablja samo nujne piškotke/shrambo (košarica v `localStorage`, seja admina). Brez piškotne pasice. To je zapisano v politiki zasebnosti.
- **Z61** `/pogoji` (splošni pogoji poslovanja), `/odstop` (pravica do odstopa + obrazec za odstop kot besedilo za kopiranje), posodobljen `/privacyPolicy`. Osnutki po ZVPot-1: 14-dnevni odstop; izjeme za hitro pokvarljivo blago in blago po specifikacijah potrošnika (sestavljene škatle s sporočilom). Obdelovalci: Stripe, Resend, Cloudflare (R2), Railway. Podatki prodajalca se berejo iz nastavitev. Na vrhu vsake pravne strani je na stagingu vidno obvestilo „Osnutek – v pregledu“ (`NOINDEX=1`).

### SEO in okolja
- **Z70** `metadataBase` iz `NEXT_PUBLIC_SITE_URL`; vsaka stran ima naslov, opis in kanonični URL.
- **Z71** `app/sitemap.ts` (statične strani, objavljeni izdelki, objavljeni programi), `app/robots.ts`. Pri `NOINDEX=1`: robots `Disallow: /` in `X-Robots-Tag: noindex` na vseh odgovorih.
- **Z72** OG slika za domačo stran in podstrani izdelkov (slika izdelka ali privzeta).
- **Z73** JSON-LD: `LocalBusiness` (ime, naslov, telefon, geo, URL) na `/` in `/about`; `Product` z `offers` (cena, `availability`) na `/products/[slug]` za naročljive izdelke.
- **Z74** Pri nastavljenih `BASIC_AUTH_USER`/`BASIC_AUTH_PASSWORD` vse poti zahtevajo HTTP Basic Auth, **razen** `/api/stripe/webhook`.

### Admin
- **Z80** Vlogi: `admin` (vse) in `urednik` (izdelki, kategorije, skupine ponudbe, mediji, tipi škatel, programi, naročila brez brisanja; lasten uporabniški račun). Urednik nima dostopa do nastavitev trgovine in do drugih uporabnikov.
- **Z81** Admin vmesnik v slovenščini (Payload prevod `sl`, če obstaja; sicer vsa polja, zbirke in gumbi z ročnimi slovenskimi oznakami). Vsako polje ima opis (`admin.description`), kaj pomeni.
- **Z82** Seznam izdelkov kaže ime, kategorijo, način prodaje, objavljen, skupno zalogo; seznam naročil gl. T7.
- **Z83** Slike se nalagajo v R2 (`@payloadcms/storage-s3`); `alt` je obvezen. Brez S3 spremenljivk se uporabi lokalni disk (razvoj, testi).

## 6. Podatkovni model (Payload)

Denar vedno v **celih centih** (`int`). Imena polj slovenska, brez šumnikov.

| Zbirka / global | Polja |
|---|---|
| `users` (auth) | `ime`, `email`, `vloga: admin\|urednik` |
| `media` (upload) | `alt` (obvezno) |
| `kategorije` | `ime`, `slug` (unikaten), `vrstniRed` |
| `skupine-ponudbe` | `ime`, `opis`, `slika` (media), `kategorije` (rel, več), `vrstniRed` |
| `izdelki` | `ime`, `slug` (iz imena, unikaten), `objavljen`, `izpostavljen`, `kategorija` (rel), `kratekOpis` (≤ 160), `opis` (rich text, neobvezno), `sestavine`, `alergeni` (neobvezno), `slike` (media, več), `nacinProdaje`, `sezona {od, do}` (1–12, neobvezno), `stopnjaDDV: 9.5\|22`, `primernoZaDarilo`, `velikosti[] {oznaka, cenaCenti, zaloga}` (min 1), `vrstniRed` |
| `tipi-skatel` | `ime`, `opis`, `slika`, `steviloMest`, `cenaCenti`, `zaloga`, `aktiven` |
| `darilni-programi` | `ime`, `slug`, `opis`, `slika`, `tipSkatle` (rel), `vsebina[] {izdelek, velikostId, kolicina}`, `objavljen` |
| `narocila` | `stevilka`, `zeton`, `status`, `nacinDostave: prevzem\|posta`, `nacinPlacila: kartica\|ob-prevzemu`, `placano`, `stripeSessionId`, `stripePaymentIntentId`, `kupec {ime, priimek, email, telefon}`, `naslov {ulica, postnaStevilka, kraj}`, `darilo`, `prejemnik {ime, ulica, postnaStevilka, kraj}`, `opomba`, `postavke[]` (gl. spodaj), `vmesniSestevekCenti`, `postninaCenti`, `skupajCenti`, `ddv[] {stopnja, osnovaCenti, ddvCenti}`, `soglasjePogoji` (čas), `stevilkaPosiljke`, `internaOpomba`, `razlogPreklica`, `zalogaVrnjena`, `napakaEposte` |
| postavka naročila | `tip: izdelek\|skatla`, `izdelek` (rel), `velikostId`, `tipSkatle` (rel), `ime`, `velikost`, `cenaCenti`, `stopnjaDDV`, `kolicina`, `vsebina[] {izdelek, velikostId, ime, velikost, cenaCenti, stopnjaDDV, kolicina}`, `sporociloNaKartici` |
| global `nastavitve-trgovine` (samo admin) | `trgovinaOdprta`, `postninaCenti` (500), `pragBrezplacnePostnineCenti` (5000), `emailObvestil` (`sandi.dercar@gmail.com`), `navodilaZaPrevzem` (besedilo), `prodajalec {naziv, naslov, davcnaStevilka, maticnaStevilka, kmgMid, telefon, email}` |

Za postavko tipa `skatla` velja: `cenaCenti` je cena tipa škatle (DDV 22 %), vsebina nosi svoje cene in stopnje.

### Seed (`npm run seed`, idempotenten; `seed:if-empty` teče ob deployu)
- Če ni uporabnikov: ustvari `admin` iz `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`.
- Če ni izdelkov: naloži slike iz `public/` v `media`, ustvari kategorije (današnjih 9 + `Sveže iz sezone`), 4 skupine ponudbe (iz `src/data/offering.ts`), izdelke po spodnji tabeli (opisi iz `priceList.ts`/`products.ts`, zaloga 20, DDV 9,5 %, `primernoZaDarilo` = true pri vseh `posta-in-prevzem`), nastavitve s privzetimi vrednostmi in praznimi podatki prodajalca razen naslova/telefona/e-pošte iz `contact.ts`.
- Demo darila: „Mala darilna škatla“ (3 mesta, 5,00 €), „Velika darilna škatla“ (6 mest, 8,00 €); programa „Okusi Dolenjske“ (mala: česen v prahu 41 ml, šparglji v prahu, marmelada borovnica) in „Za kuharje“ (velika: česen v prahu 106 ml, čebula v prahu, paradižnik v prahu, suhi peteršilj, testenine s šparglji, bučno olje 0,5 L). Opis programov se začne z „[DEMO]“.

| Izdelek | Kategorija | Velikosti (cena) | Način | Sezona |
|---|---|---|---|---|
| Šparglji | Sveža zelenjava | šopek 0,5 kg (5,50) | samo-prevzem | 4–6 |
| Redkvica | Sveža zelenjava | šopek (2,50) | samo-prevzem | — |
| Jagode | Sveže iz sezone | — | samo-prikaz | 5–7 |
| Česen | Sveže iz sezone | — | samo-prikaz | 9–10 |
| Krompir | Sveže iz sezone | — | samo-prikaz | 8–10 |
| Česen v prahu | Začimbe | 41 ml (15 g) (5,00); 106 ml (40 g) (12,00) | posta-in-prevzem | — |
| Šparglji v prahu | Začimbe | 106 ml (18 g) (5,00) | posta-in-prevzem | — |
| Čebula v prahu | Začimbe | 106 ml (35 g) (9,00) | posta-in-prevzem | — |
| Paradižnik v prahu | Začimbe | 20 g (6,00) | posta-in-prevzem | — |
| Suhi peteršilj | Začimbe | 212 ml (15 g) (5,00) | posta-in-prevzem | — |
| Čebulni čips | Prigrizki | 45 g (10,00) | posta-in-prevzem | — |
| Jajca kokošja | Jajca | 10 kos (3,00) | samo-prevzem | — |
| Jajca prepeličja | Jajca | 18 kos (5,00) | samo-prevzem | — |
| Vložena prepeličja jajca | Jajca | 370 ml (8,00) | samo-prevzem | — |
| Liofilizirane jagode, breskve | Liofilizirano sadje | 370 ml (20 g) (8,00) | posta-in-prevzem | — |
| Liofilizirane borovnice | Liofilizirano sadje | 370 ml (40 g) (13,00) | posta-in-prevzem | — |
| Liofilizirane mix | Liofilizirano sadje | 370 ml (40 g) (13,00) | posta-in-prevzem | — |
| Liofilizirane maline | Liofilizirano sadje | 370 ml (20 g) (8,00) | posta-in-prevzem | — |
| Fižol liofiliziran | Liofilizirano sadje | 280 g (10,00) | posta-in-prevzem | — |
| Marmelada borovnica | Marmelade in vloženo | 370 ml (8,00) | posta-in-prevzem | — |
| Vloženi jurčki | Marmelade in vloženo | 370 ml (12,00) | posta-in-prevzem | — |
| Testenine s šparglji | Testenine | 150 g (5,00) | posta-in-prevzem | — |
| Bučno olje | Olja | 1 L (20,00); 0,5 L (12,00) | posta-in-prevzem | — |
| Olivno olje | Olja | 1 L (20,00); 0,5 L (12,00) | posta-in-prevzem | — |
| Aronija sok | Sokovi | 1 L (10,00) | posta-in-prevzem | — |

Izpostavljeni: Šparglji, Jagode. Po uspešnem seedu se `src/data/priceList.ts`, `products.ts`, `offering.ts` izbrišejo (podatke za seed premakni v `src/seed/`); `contact.ts` ostane le, če ga še kaj uporablja, sicer gre v nastavitve.

## 7. Vsebina: kaj priskrbi lastnik (ne blokira dela)

Agent dela z demo/obstoječo vsebino; spodnje lastnik vnese v admin med iteracijami.

| Kaj | Kje se vnese | Do takrat |
|---|---|---|
| Fotografije izdelkov in darilnih škatel | admin → mediji | obstoječe slike, nadomestna ploskev |
| Opisi, sestavine, alergeni | admin → izdelki | opisi iz `priceList.ts` |
| Cene svežih (jagode, česen, krompir), če bodo naročljivi | admin | `samo-prikaz` |
| Realni tipi škatel, cene, programi | admin | demo (P12, §6) |
| Podatki prodajalca (naziv, davčna, matična, KMG-MID) | admin → nastavitve | prazno, pravne strani kažejo `[manjka: …]` |
| Potrditev DDV stopenj in računov | računovodja | P5, potrdilo „To ni račun.“ |
| Pregled pravnih besedil | lastnik/računovodja | osnutki z oznako |

## 8. Tehnične odločitve

| Področje | Odločitev |
|---|---|
| Next | nadgradnja na `next@^16.4` (Payload zahteva ≥ 16.3.3). `eslint-config-next@^16.4`, skripta `lint` = `eslint .` (`next lint` v 16 ne obstaja). V Next 16 je `middleware.ts` preimenovan v `proxy.ts` – agent preveri v dokumentaciji in uporabi pravo ime. |
| Node | Payload 3.93 zahteva Node `^22.23.4`. `package.json` `engines.node` = `">=22.23.4 <23"`. |
| CMS | `payload@^3.93`, `@payloadcms/next`, `@payloadcms/db-postgres`, `@payloadcms/richtext-lexical`, `@payloadcms/storage-s3`, `@payloadcms/email-resend`. Struktura `src/app/(frontend)/…` in `src/app/(payload)/…` (vsaka skupina svoj root layout). Migracije Payload v repu (`src/migrations`), brez `push` v produkciji/stagingu. |
| Baza | Postgres (Railway, en na okolje). Lokalno `docker-compose.yml` s Postgres 17. |
| Plačila | `stripe` (Node SDK, zadnja 23.x). Brez `@stripe/stripe-js` (gostovan Checkout). |
| Validacija | `zod@^4`. |
| UI | Tailwind 4 tokeni, Radix primitivi (`@radix-ui/react-*` po potrebi), `framer-motion` ostane, `react-icons` ostane ali se zamenja z enim setom ikon (odloči agent, en sam set). |
| Odstrani | `react-slick`, `slick-carousel`, `@types/react-slick`, `classnames`, `tailwindcss-animate` če neuporabljen, slike `public/home2.jpg`, `public/sparglji1.jpg`, `public/sparglji2.png` (preverjeno neuporabljene), `navodila.md` premakni v `docs/arhiv/navodila-2025.md`. |
| Testi | `vitest@^5` (enote + integracija z Postgres), `@playwright/test@^1.65` (e2e na `next build && next start` z očiščeno in seedano bazo). |
| CI | `.github/workflows/ci.yml`: na PR v `staging` in `main`: install, `tsc --noEmit`, lint, vitest, playwright (Postgres service). Stripe e2e teče le, če so v GitHub secrets `STRIPE_SECRET_KEY` (test) in Stripe CLI za webhook; sicer se preskoči z jasnim izpisom. |
| Deploy | `railway.json`: build `npm run build`, pre-deploy `npm run migrate && npm run seed:if-empty`, start `npm run start`. |
| Ura | Vsa logika sezon in letnice številk v `Europe/Ljubljana`. |

### Okoljske spremenljivke

| Spremenljivka | Staging | Prod | Priskrbi |
|---|---|---|---|
| `DATABASE_URL` | Railway Postgres (staging) | Railway Postgres (prod) | lastnik (doda Postgres v Railway) |
| `PAYLOAD_SECRET` | naključen | naključen, drugačen | lastnik (`openssl rand -hex 32`) |
| `NEXT_PUBLIC_SITE_URL` | Railway staging URL | `https://www.teslan.si` | lastnik |
| `STRIPE_SECRET_KEY` | `sk_test_…` | `sk_live_…` | lastnik (Stripe račun kmetije) |
| `STRIPE_WEBHOOK_SECRET` | iz Stripe webhooka za staging URL | iz webhooka za prod | lastnik |
| `RESEND_API_KEY` | ključ | ključ | lastnik (Resend + domena `teslan.si` overjena v Cloudflare DNS) |
| `EMAIL_FROM` | `Domačija Tešlan <narocila@teslan.si>` | isto | — |
| `EMAIL_REDIRECT_TO` | lastnikov e-naslov | **ni nastavljeno** | lastnik |
| `S3_BUCKET`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL` | R2 bucket `teslan-staging` | R2 bucket `teslan-prod` | lastnik (Cloudflare R2 + API token + javni dostop) |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | da | da | lastnik |
| `NOINDEX` | `1` | ni nastavljeno | — |
| `BASIC_AUTH_USER`, `BASIC_AUTH_PASSWORD` | da | ni nastavljeno | lastnik |

Vse spremenljivke so dokumentirane v `.env.example` (brez vrednosti) in validirane ob zagonu z Zod (`src/env.ts`); manjkajoča obvezna spremenljivka v produkciji ustavi zagon z jasnim sporočilom. Ključi niso nikoli v repu ali logih.

## 9. Sprejemni kriteriji

Delo je končano, ko velja vse spodaj. Kjer piše **(e2e)** / **(unit)**, mora obstajati avtomatski test, ki to preveri.

- **S1** CI je zelen na zadnjem commitu `staging`: typecheck, lint, vitest, playwright.
- **S2** (unit) Poštnina: 49,99 € → 5,00 €; 50,00 € → 0 €; prevzem → 0 €; vrednosti iz nastavitev.
- **S3** (unit) DDV: postavke 9,5 % in 22 % dajo pravilno razčlenitev, vsota osnov + DDV = skupaj na cent.
- **S4** (unit) Sezona: `{11,2}` je v januarju v sezoni, v marcu ne; mesec pred začetkom vrne „Kmalu“.
- **S5** (unit) Prehodi statusov po Z33; nedovoljen prehod vrže napako.
- **S6** (integracija) Dve sočasni naročili za zadnji kos: uspe natanko eno, zaloga nikoli < 0.
- **S7** (integracija) Preklic dvakrat zapored vrne zalogo enkrat.
- **S8** (integracija) Ponovljen `checkout.session.completed` ne pošlje e-pošte dvakrat; `expired` vrne zalogo.
- **S9** (e2e) T2 od začetka do konca: naročilo nastane, zaloga −1, e-pošta E1 in E2 v logu, `/narocilo/...` brez `k` vrne 404.
- **S10** (e2e) T4: košarica z jajci ne ponudi pošte; brez jajc pošta ponudi samo kartico.
- **S11** (e2e, če so Stripe test ključi) T3 s kartico `4242 4242 4242 4242`: naročilo `novo`, `placano=true`. Prekinitev na Stripu vrne zalogo.
- **S12** (e2e) T5: program „Okusi Dolenjske“ v košarico, sporočilo vidno v naročilu; konfigurator ne dovoli več kosov kot mest; neprimeren izdelek ni na izbiro.
- **S13** (e2e) Urednik se prijavi, uredi zalogo izdelka, sprememba je na `/products/[slug]` v ≤ 60 s; urednik ne vidi nastavitev trgovine in uporabnikov.
- **S14** (e2e) Izdelek `samo-prikaz` je viden na `/products`, nima gumba „V košarico“; neobjavljen izdelek vrne 404.
- **S15** (e2e) `trgovinaOdprta=false` skrije nakupne gumbe in blagajna zavrne oddajo.
- **S16** (e2e) Z `NOINDEX=1`: `/robots.txt` vsebuje `Disallow: /`, odgovori imajo `X-Robots-Tag: noindex`; z basic auth spremenljivkami `/` vrne 401 brez gesla, `/api/stripe/webhook` ne.
- **S17** (e2e) Axe (`@axe-core/playwright`) na `/`, `/products`, `/products/<slug>`, `/kosarica`, `/blagajna`, `/darila/sestavi`: 0 kršitev stopnje „serious“ ali „critical“.
- **S18** Lighthouse (mobilno) na stagingu za `/` in `/products`: Performance ≥ 85, Accessibility ≥ 95, SEO ≥ 95 (rezultat zapisan v PR-ju koraka K13).
- **S19** Staging deluje na Railwayu: migracije in seed uspešni, admin prijava deluje, slike se nalagajo v R2, e-pošta pride na `EMAIL_REDIRECT_TO`, testno kartično naročilo se zaključi prek webhooka.
- **S20** V repu ni ostankov: `grep -r "slick\|classnames" src package.json` je prazen, `src/data/priceList.ts` ne obstaja, README opisuje zagon, okolja, seed, deploy.

## 10. Koraki (vsak = en PR v `staging`, v tem vrstnem redu)

| K | Naslov | Vsebina | Pokrije |
|---|---|---|---|
| K1 | Temelji | Next 16.4, eslint 16 + `eslint .`, Node engines, odstranitev mrtvih paketov/slik, `navodila.md` v arhiv, Vitest + Playwright nastavitev, CI, `.env.example`, `src/env.ts`, README osnutek | Z (tehn.), S20 delno |
| K2 | Identiteta in UI knjižnica | tokeni, fonta, komponente (Button, Input, Field, RadioGroup, Select, Dialog/Sheet, Badge, Card, Price, Toast, Skeleton, EmptyState), `/styleguide` | Z1–Z4, Z6 |
| K3 | Payload osnova | Payload v `(payload)`, frontend v `(frontend)`, Postgres, `docker-compose.yml`, `users` z vlogami, `media` + R2/lokalno, migracije, `railway.json`, slovenski admin | Z80, Z81, Z83 |
| K4 | Model kataloga + seed | `kategorije`, `skupine-ponudbe`, `izdelki`, `nastavitve-trgovine`, validacije, dostop, `seed`/`seed:if-empty`, revalidacija hooki; brisanje `src/data/*` | Z10–Z12, Z17, Z52, §6 |
| K5 | Nove javne strani | glava, noga, `/`, `/products`, `/products/[slug]`, `/about`, `/privacyPolicy` (obstoječa vsebina) na novem UI in CMS podatkih | Z5, Z7, Z8, Z13–Z16, S14 |
| K6 | Košarica | cenovni modul (čiste funkcije: poštnina, DDV, pravila dostave), localStorage košarica, strežniško preverjanje, `/kosarica`, ikona v glavi | Z20–Z24, S2–S4 |
| K7 | Blagajna in naročila | `narocila`, statusi, oddaja v transakciji, številke, žeton, `/blagajna`, `/narocilo/[stevilka]`, ob prevzemu, honeypot + omejitev, stikalo trgovine, admin seznam naročil | Z25–Z27, Z30–Z35, Z43, S5–S7, S9, S10, S15 |
| K8 | Stripe | Checkout, webhook, iztek, preklic ob vrnitvi | Z40–Z42, S8, S11 |
| K9 | E-pošta | Resend adapter, predloge E1–E5, preusmeritev na stagingu, beleženje napak, sprožitev ob statusih | Z56–Z59 |
| K10 | Darila | `tipi-skatel`, `darilni-programi`, `/darila`, `/darila/sestavi`, škatla v košarici/blagajni/naročilu, prejemnik, demo seed | Z50–Z55, S12 |
| K11 | Pravne strani | `/pogoji`, `/odstop`, posodobljena zasebnost, povezave v nogi in blagajni | Z60, Z61 |
| K12 | SEO in zaščita | metadata, sitemap, robots, OG, JSON-LD, noindex, basic auth | Z70–Z74, S16 |
| K13 | Kakovost in predaja | axe in Lighthouse popravki, README dokončan, kontrolni seznam za lastnika v `docs/nacrti/spletna-trgovina-predaja.md`, deploy na staging in preverjanje S19 | S17–S20 |

Pravila za vsak PR: veja `nacrt/kN-<kratko>` iz najnovejšega `staging`; PR v `staging`; opis vsebuje seznam pokritih Z/S in kako preveriti; merge šele ko je CI zelen. Commiti in PR-ji v slovenščini.

## 11. Tveganja, odprta vprašanja, lastnikova roka

### Tveganja
| Tveganje | Ublažitev |
|---|---|
| Payload + Next 16 nezdružljivosti (nova kombinacija) | K3 najprej zgradi minimalen admin in deploy; če Payload 3.93 ne deluje z Next 16.4, uporabi zadnjo kombinacijo, ki jo Payload uradno podpira, in to zapiše v PR. |
| Davčno potrjevanje računov / DDV | Izven obsega; produkcija blokirana do potrditve računovodje (§12). |
| Prodaja več, kot je zaloge | Transakcija z zaklepanjem vrstic (`SELECT … FOR UPDATE` ali enakovredno prek Drizzle v Payload), test S6. |
| Stripe webhook nedosegljiv za basic auth | Izjema v Z74, test S16. |
| Nova identiteta ne bo všeč | Namenoma: lastnik iterira na stagingu; tokeni so na enem mestu, zato je zamenjava poceni. |

### Odprta vprašanja (vse odloči agent)
- Konkretna paleta, tipografija, postavitve in animacije (v okviru Z1–Z6). **Odloči agent.**
- Set ikon. **Odloči agent.**
- Natančna besedila UI in e-pošte (slovensko, tikanje ali vikanje: **vikanje**, kot obstoječa stran). Ostalo **odloči agent.**
- Organizacija map znotraj `src/`. **Odloči agent.**

### Kaj zahteva lastnikovo roko
1. Railway: dodati Postgres v staging in prod okolje; nastaviti spremenljivke iz §8; pre-deploy ukaz se prebere iz `railway.json`.
2. Stripe: račun kmetije, testni ključi za staging (takoj), webhook endpoint `https://<staging>/api/stripe/webhook` z dogodkoma `checkout.session.completed` in `checkout.session.expired`; live ključi pred produkcijo.
3. Resend: račun, domena `teslan.si`, DNS zapisi v Cloudflare (SPF, DKIM, po želji DMARC).
4. Cloudflare R2: dva bucketa, API token z dostopom samo do njiju, javni dostop (r2.dev ali poddomena, npr. `slike.teslan.si`).
5. GitHub: secrets za CI (Stripe test ključ, neobvezno).
6. Računovodja: DDV stopnje, potreba po davčno potrjenih računih, pregled pravnih besedil.
7. Admin: ustvari uporabnika z vlogo `urednik` za Sandija.
8. Vsebina iz §7.

Če ključ manjka med izvajanjem, agent **ne čaka**: uporabi lokalne nadomestke (lokalni disk, e-pošta v log, Stripe testi preskočeni), konča korak in manjkajoče zapiše v opis PR-ja in v kontrolni seznam predaje.

## 12. Pravila izdaje

1. Agent nikoli ne pusha v `main` in ne odpira PR-jev v `main`.
2. Vse gre prek PR-jev v `staging`; Railway samodejno deploya `staging`.
3. Prehod v produkcijo (PR `staging` → `main`) odpre in združi **lastnik**, ko:
   - so izpolnjeni S1–S20,
   - je lastnik potrdil videz in delovanje na stagingu,
   - je računovodja potrdil DDV, račune in pravna besedila; podatki prodajalca so vneseni,
   - so v produkciji nastavljeni live Stripe ključi, prod R2, Resend, `NEXT_PUBLIC_SITE_URL=https://www.teslan.si`, brez `NOINDEX`/basic auth,
   - je prod baza migrirana in seedana ter je Sandi dobil račun urednika.
4. Po izdaji: testno naročilo z majhnim zneskom v produkciji, vračilo v Stripu, preklic v adminu.
