# Domačija Tešlan — Celoten redesign specifikacija

## Pregled projekta

Spletna stran za kmetijo Domačija Tešlan (Podgora 15, 8351 Straža pri Novem mestu).
Cilj: privabiti obiskovalce, da pridejo na kmetijo osebno.
Stack: Next.js 15 (React 19), TypeScript, Tailwind CSS.
Stil: moderno & bold z veliko animacijami + naravni elementi.

---

## 1. Barvna paleta & tipografija

### Barve

```typescript
// tailwind.config.ts — extend colors
const colors = {
  green: {
    deep: '#1a3a2a',     // primarni temni — header, hero bg, footer
    mid: '#2d5a3f',      // sekundarni — CTA sekcija bg
    light: '#4a8c5e',    // akcenti — value card top border, tagi
    bright: '#7bc47f',   // highlight — gumbi, poudarki, statistike
  },
  cream: {
    DEFAULT: '#f5f0e8',  // page background
    dark: '#e8e0d0',     // subtle borders, card borders
  },
  brown: {
    DEFAULT: '#8b6914',  // sezonski labels (jesen)
    light: '#c49a2a',    // sezonski labels (kmalu)
  },
  text: {
    dark: '#1a1a18',     // naslovi
    mid: '#4a4a42',      // body text
    light: '#7a7a70',    // subtle text, opisi
  },
}
```

### Tipografija

```
Display font: "DM Serif Display" (Google Fonts) — za naslove, statistike, logotip
Body font: "Manrope" (Google Fonts) — za body text, navigacijo, gumbe, tage

Velikosti:
- Hero naslov: 56px (desktop) / 36px (mobile), line-height 1.1
- Section naslov: 40px (desktop) / 28px (mobile)
- Card naslov: 24px
- Body text: 15-16px, line-height 1.7
- Tag/label: 10-11px, font-weight 700, letter-spacing 2.5px, uppercase
- Nav links: 14px, font-weight 600
```

---

## 2. Struktura strani (od vrha do dna)

Stran ima 7 sekcij v sledečem vrstnem redu:

1. **Header** (sticky, z blur)
2. **Hero — Špargljev šop z scroll explode animacijo** (to je GLAVNI wow element)
3. **Vrednosti** (3 kartice)
4. **Izdelki** (produktna sekcija)
5. **Obiščite nas** (kontakt + karta)
6. **CTA sekcija** (telefonska + navodila)
7. **Footer**

---

## 3. HEADER

### Vizualno
- Sticky na vrhu (position: fixed, z-index: 50)
- Background: `cream` z `backdrop-filter: blur(12px)` in rahlo prosojnostjo `rgba(245,240,232,0.92)`
- Spodnji border: 1px `cream-dark`
- Padding: 16px 32px (desktop), 12px 16px (mobile)

### Vsebina
- **Levo**: Logotip — okrogel krog (`green-deep` bg, 36px) z "T" črko v `green-bright` + "Tešlan" v DM Serif Display
- **Desno**: Navigacija horizontalno:
  - Domov, Izdelki, O nas, Galerija — navadni linki
  - "Obiščite nas" — CTA gumb (pill shape, `green-deep` bg, `cream` text, border-radius 24px)
- **Mobile**: Hamburger meni z slide-in drawer od desne

### Animacija
- Header se prikaže s `translateY(-100%)` → `translateY(0)` ob loadu (0.5s ease-out)
- Ob scrollu navzdol: header postane bolj compacten (padding zmanjšan na 8px vertical)
- Na Hero sekciji je header transparent, ko scrollaš mimo hero-ja dobi cream background

---

## 4. HERO — ŠPARGLJEV ŠOP S SCROLL EXPLODE ANIMACIJO

**To je najpomembnejša sekcija — WOW efekt cele strani.**

### Koncept

Na vrhu strani je 5-7 SVG špargljev tesno skupaj v šopu, čez celoten viewport (100vh).
Ozadje je `green-deep` z rahlim dot patternom.

Ko uporabnik scrolla navzdol:
1. **Faza 1 (0-30% scrolla)**: Hero tekst (naslov, podnaslov) fade-out
2. **Faza 2 (20-80% scrolla)**: Šparglji se razpršijo narazen — vsak pelje v svojo smer (nekateri levo, nekateri desno, en gre gor). Imajo easing (ease-in-out). Hkrati se zmanjšajo (scale 1 → 0.8) in postanejo prosojni (opacity 1 → 0.2)
3. **Faza 3 (40-90% scrolla)**: Med šparglji se pojavijo content kartice s fade-in + translateY animacijo
4. **Faza 4 (80-100%)**: Šparglji so skoraj nevidni, kartice so polno vidne, scroll-snap v naslednjo sekcijo

### SVG šparglji — specifikacija

Vsak špargel je SVG `<g>` element z:
- **Konica** (tip): `<path>` v obliki kaplje/konice, barva temnejša zelena
- **Steblo**: `<rect>` z zaokroženimi konci (rx = width/2), barva svetlejša zelena
- **Poganjki** (bracts): 3-5 majhnih `<path>` krivih na straneh stebla, barva enaka konici
- Vsak špargel ima svojo višino (300-450px v SVG koordinatah) in debelino (10-14px)

Definiraj 5-7 špargljev s temi podatki:

```typescript
interface SpearConfig {
  id: string;
  baseX: number;       // začetna X pozicija (skupaj v šopu)
  baseY: number;       // začetna Y pozicija
  explodeX: number;    // koliko se premakne v X smeri ob razpršitvi
  explodeY: number;    // koliko se premakne v Y smeri ob razpršitvi
  explodeRotate: number; // rotacija v stopinjah ob razpršitvi
  height: number;      // višina stebla
  width: number;       // debelina stebla
  color: string;       // glavna barva (variacije zelene)
  colorDark: string;   // temnejša variacija za konico/poganjke
  bractsCount: number; // število poganjkov na straneh
}

const spears: SpearConfig[] = [
  { id: 'spear-1', baseX: -80, baseY: 20,  explodeX: -320, explodeY: -60,  explodeRotate: -15, height: 380, width: 10, color: '#6ab35a', colorDark: '#5a9e4a', bractsCount: 4 },
  { id: 'spear-2', baseX: -40, baseY: -10, explodeX: -140, explodeY: -80,  explodeRotate: -8,  height: 420, width: 12, color: '#5c9e4e', colorDark: '#4a8c3e', bractsCount: 5 },
  { id: 'spear-3', baseX: 0,   baseY: -30, explodeX: 0,    explodeY: -100, explodeRotate: 2,   height: 450, width: 14, color: '#4e9040', colorDark: '#3d7a32', bractsCount: 5 },
  { id: 'spear-4', baseX: 40,  baseY: 0,   explodeX: 140,  explodeY: -60,  explodeRotate: 10,  height: 400, width: 11, color: '#6aad5c', colorDark: '#5a9e4a', bractsCount: 4 },
  { id: 'spear-5', baseX: 80,  baseY: 15,  explodeX: 320,  explodeY: -40,  explodeRotate: 18,  height: 370, width: 10, color: '#5c9e4e', colorDark: '#4a8c3e', bractsCount: 3 },
];
```

**POMEMBNO**: baseX/baseY so offset od centra viewporta. Šparglji so na začetku centrirani.

### Scroll-linked animacija z Framer Motion

```tsx
// Uporabi framer-motion useScroll in useTransform
import { useScroll, useTransform, motion } from 'framer-motion';

// V hero komponenti:
const heroRef = useRef<HTMLDivElement>(null);
const { scrollYProgress } = useScroll({
  target: heroRef,
  offset: ["start start", "end start"]  // od začetka sekcije do konca
});

// Za vsak špargel:
const spearX = useTransform(scrollYProgress, [0, 0.8], [spear.baseX, spear.baseX + spear.explodeX], { ease: easeInOut });
const spearY = useTransform(scrollYProgress, [0, 0.8], [spear.baseY, spear.baseY + spear.explodeY], { ease: easeInOut });
const spearRotate = useTransform(scrollYProgress, [0, 0.8], [0, spear.explodeRotate]);
const spearScale = useTransform(scrollYProgress, [0, 0.8], [1, 0.8]);
const spearOpacity = useTransform(scrollYProgress, [0, 0.6, 0.9], [1, 0.6, 0.15]);

// Za hero tekst (fade out hitro):
const heroTextOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);

// Za content kartice (fade in pozneje):
const cardsOpacity = useTransform(scrollYProgress, [0.3, 0.6], [0, 1]);
const cardsY = useTransform(scrollYProgress, [0.3, 0.6], [60, 0]);
```

### Hero — začetno stanje (pred scrollom)

Čez cel viewport (100vh minimum, bolj 150vh za scroll prostor) z `green-deep` ozadjem.

Centralno:
- Zgoraj: tag "Domačija Tešlan — Dolenjska" (pill shape, border)
- Naslov: "Iz naše zemlje, na vašo *mizo*" (mizo je italic v `green-bright`)
- Podnaslov: "Ekološko pridelana zelenjava in sadje..."
- 2 gumba: "Pridite k nam →" (primary), "Naši izdelki" (secondary/outline)

Pod tekstom, vertikalno centrirani: šop špargljev

Spodaj: 3 statistike v vrsti: "15+ let izkušenj", "100% ekološko", "4km od Novega mesta"

### Content kartice (se pojavijo ob razpršitvi)

Ko se šparglji razpršijo, se med njimi pojavijo 3-4 kartice:

**Kartica 1** — temna (green-deep bg, 95% opacity):
- Tag: "LOKALNO"
- Naslov: "Pridelano na naši zemlji"
- Opis: "Vsak pridelek raste v Podgori..."

**Kartica 2** — dva stat boxa v gridu (2 koloni):
- Box 1: "15+" + "let izkušenj"
- Box 2: "100%" + "ekološko"
- Background: cream, 95% opacity

**Kartica 3** — z zelenim outline (green-light border):
- Tag: "SEZONA"
- Naslov: "April — Junij"
- Opis: "Sveži šparglji, pobrani vsako jutro..."

**Kartica 4** — CTA gumb:
- "Pridite k nam →" pill gumb, green-deep bg

Kartice se pojavijo s stagger (vsaka 0.1s zakasnitev za prejšnjo).

### Responsive

- **Desktop (>1024px)**: Šparglji so veliki, kartice so absolutno pozicionirane med šparglji
- **Tablet (768-1024px)**: Šparglji manjši, kartice pod njimi v koloni
- **Mobile (<768px)**: Šparglji se samo fade-outajo (brez explode), kartice so navadne kartice s scroll reveal

### Scroll prostor

Hero sekcija mora biti visoka **200vh** (dvakrat viewport) da je dovolj scroll prostora za celotno animacijo. Vsebina za hero-jem se začne šele po 200vh.

---

## 5. VREDNOSTI (3 kartice)

### Vizualno
- Background: `cream`
- Padding: 80px vertical, 40px horizontal
- Grid: 3 kolone na desktop, 1 kolona na mobile

### Vsaka kartica
- Background: white (`#ffffff`)
- Border: 1px `cream-dark`
- Border-radius: 16px
- Padding: 28px 24px
- Zgornji rob: 3px solid `green-light`
- Ikona: 44x44px zaokrožen kvadrat z `green-light` at 10% opacity bg, ikona SVG inline

**Kartica 1**: Ikona: layers/stack → "Lokalno pridelano" → "Vsak pridelek raste na naši zemlji v Podgori. Brez posrednikov, neposredno z njive k vam."

**Kartica 2**: Ikona: clock → "Vedno sveže" → "Pobrano zjutraj, pri vas popoldne. Naši izdelki ne potujejo po skladiščih in trgovinah."

**Kartica 3**: Ikona: shield → "Trajnostno" → "Skrbimo za okolje z ekološkimi metodami pridelave in minimalno uporabo embalaže."

### Animacija
- Scroll-triggered: kartice se pojavijo z `opacity: 0, translateY: 40px` → `opacity: 1, translateY: 0`
- Stagger: vsaka kartica 0.15s za prejšnjo
- Uporabi `framer-motion` `whileInView` z `viewport={{ once: true, amount: 0.3 }}`

---

## 6. IZDELKI (produktna sekcija)

### Vizualno
- Background: `green-deep`
- Padding: 80px vertical, 40px horizontal

### Section header
- Tag: "NAŠA PONUDBA" (green-bright, uppercase, letter-spacing)
- Naslov: "Sezonski pridelki" (DM Serif Display, 40px, cream)
- Podnaslov: "Pridelujemo tisto, kar zemlja naravno ponudi v vsakem letnem času."

### Produktni grid
- 2x2 grid na desktop, 1 kolona na mobile
- Gap: 24px

### Vsak produkt card
- Background: `rgba(245,240,232,0.06)` (rahlo svetlejša od bg)
- Border: 1px `rgba(245,240,232,0.08)`
- Border-radius: 16px
- Overflow: hidden

Struktura:
1. **Image area** (180px visoka): placeholder z SVG ilustracijo produkta + gradient overlay
   - Badge v zgornjem levem kotu: status sezone ("Na voljo" = green-bright, "Kmalu" = brown-light, "Jesen" = text-light)
2. **Info area** (padding 24px):
   - Ime: DM Serif Display, 24px, cream
   - Opis: 13px, cream at 50% opacity, 2-3 vrstice
   - Meta row (flex, space-between):
     - Levo: sezona text (npr. "April — Junij")
     - Desno: "Več →" link/gumb (pill shape, subtle bg)

### 4 produkti

| Produkt | Status | Sezona | Opis |
|---------|--------|--------|------|
| Šparglji | Na voljo | April — Junij | Sveži zeleni šparglji, ročno pobrani vsako jutro. Nežen okus, popolni za na žar ali v solato. |
| Jagode | Kmalu | Maj — Julij | Sladke, sočne jagode pridelane brez pesticidov. Popolne za sveže uživanje ali predelavo. |
| Česen | Jesen | September — Oktober | Domači česen z intenzivnim okusom. Idealen za kuhanje, kisanje ali kot naravno zdravilo. |
| Krompir | Jesen | Avgust — Oktober | Domači krompir raznih sort. Odličen za pečenje, kuhanje ali kot priloga. |

### Animacija
- Scroll-triggered reveal (stagger 0.1s)
- Hover na kartici: scale(1.02) s transition 0.3s + rahel shadow
- Image area ob hover: scale(1.05) z overflow hidden (parallax feel)

---

## 7. OBIŠČITE NAS

### Vizualno
- Background: `cream`
- Padding: 80px vertical, 40px horizontal
- 2-kolonski grid: leva = vsebina, desna = Google Maps embed

### Leva kolona
- Tag: "OBIŠČITE NAS"
- Naslov: "Pridite na Domačijo Tešlan" (DM Serif Display, 40px)
- Opis paragraf: "Vabimo vas, da nas obiščete..."

3 info vrstice (vsaka z ikono):
1. **Pin ikona** → "Naslov" → "Podgora 15, 8351 Straža pri Novem mestu"
2. **Phone ikona** → "Telefon" → "+386 40 578 512"
3. **Calendar ikona** → "Odpiralni čas" → "Po dogovoru — pokličite pred obiskom"

### Desna kolona
- Google Maps embed (iframe) z lokacijo kmetije
- Koordinate: ~45.79°N, 15.13°E (Podgora, Straža)
- Border-radius: 16px, overflow hidden
- Višina: 360px
- Border: 1px cream-dark

### Animacija
- Scroll-triggered: leva stran slide-in z leve, desna z desne
- `whileInView` framer motion

---

## 8. CTA SEKCIJA

### Vizualno
- Background: `green-mid`
- Padding: 80px vertical
- Text-align: center

### Vsebina
- Naslov: "Sveže iz kmetije, danes na vaši mizi" (DM Serif Display, 36px, cream)
- Podnaslov: "Pokličite nas ali pa kar pridite. Vedno smo veseli novih obrazov na naši kmetiji."
- 2 gumba:
  - "040 578 512" → `tel:` link, pill, cream bg, green-deep text (primary)
  - "Navodila za pot →" → Google Maps link, outline pill, cream border (secondary)

### Animacija
- Gumba imata subtilen pulse shadow efekt (ponavljajoč)
- Scroll-triggered fade-in

---

## 9. FOOTER

### Vizualno
- Background: `green-deep`
- Padding: 48px horizontal, 36px vertical

### Layout (3 kolone + spodnja vrstica)
1. **Brand kolona**: Logotip (T krog + "Tešlan") + "Domačija Tešlan — Podgora, Dolenjska"
2. **Strani**: Domov, Izdelki, O nas, Zasebnost
3. **Kontakt**: Email, telefon, Google Maps link

**Spodnja vrstica** (ločena z 1px border):
- "© 2025 Domačija Tešlan. Vse pravice pridržane."
- "Izdelano z ljubeznijo na Dolenjskem."

---

## 10. Globalne animacije & efekti

### Page load
- Header slide-in od zgoraj (0.5s)
- Hero tekst staggered fade-in (vsak element 0.1s zamik)
- Šparglji scale from 0.8 → 1 z rahlo spring animacijo

### Scroll-based
- Vse sekcije pod hero-jem: `whileInView` z `viewport={{ once: true, amount: 0.2 }}`
- Default enter animacija: `opacity: 0, y: 40` → `opacity: 1, y: 0` z `duration: 0.6, ease: "easeOut"`
- Stagger za elemente znotraj sekcije: 0.1-0.15s

### Hover
- Vsi gumbi: `scale(1.03)` + `transition: 0.2s`
- Product kartice: `scale(1.02)` + image `scale(1.05)`
- Nav linki: color transition na `green-light`

### Smooth scroll
- `scroll-behavior: smooth` na html elementu
- Navigacijski linki scrollajo do ustrezne sekcije

---

## 11. Responsive breakpoints

```
Mobile:  < 768px
Tablet:  768px - 1024px
Desktop: > 1024px
```

Ključne mobile prilagoditve:
- Hero naslov: 36px namesto 56px
- Sekcijski naslovi: 28px namesto 40px
- Gridi postanejo 1 kolona
- Šparglji hero: poenostavljena animacija (samo fade, brez explode)
- Padding sekcij: 48px vertical, 20px horizontal
- Hamburger navigacija z drawer

---

## 12. Tehnične zahteve

### Paketi za namestitev
```bash
npm install framer-motion
# Google Fonts se naložijo v layout.tsx z next/font/google ali v <head>
```

### Datotečna struktura (predlagana)
```
src/
├── app/
│   ├── layout.tsx          # Font setup, metadata
│   ├── page.tsx            # Glavna stran — vse sekcije
│   └── globals.css         # Tailwind + custom properties
├── components/
│   ├── Header.tsx          # Sticky header z blur
│   ├── HeroAsparagus.tsx   # GLAVNI — hero z scroll animacijo špargljev
│   ├── AsparagusSpear.tsx  # Posamezen SVG špargel (reusable)
│   ├── ValuesSection.tsx   # 3 value kartice
│   ├── ProductsSection.tsx # Produktni grid
│   ├── ProductCard.tsx     # Posamezna produktna kartica
│   ├── VisitSection.tsx    # Obiščite nas + karta
│   ├── CTASection.tsx      # Call to action
│   └── Footer.tsx          # Footer
├── data/
│   └── products.ts         # Produktni podatki (hardcoded)
│   └── spears.ts           # Špargljeve konfiguracije
└── lib/
    └── animations.ts       # Shared animation variants za framer-motion
```

### Ključne implementacijske opombe

1. **Hero sekcija mora biti 200vh visoka** da je dovolj scroll prostora za animacijo
2. **SVG šparglji so absolutno pozicionirani** znotraj hero containerja, centrirani
3. **Content kartice** so prav tako absolutno pozicionirane in se pojavijo med šparglji
4. **`useScroll` z `target` referenco** na hero div za scroll progress
5. **`useTransform`** za mapiranje scroll progress na CSS transformacije
6. **Vsak špargel je svoja `motion.g`** komponenta z individualnimi transform vrednostmi
7. **Mobile fallback**: na mobilnih napravah uporabi preprosto fade animacijo namesto explode
8. **Performance**: dodaj `will-change: transform` na špargljev in `transform: translateZ(0)` za GPU acceleration
9. **Preloading fontov**: uporabi `next/font/google` za DM Serif Display in Manrope

### SEO & Meta
```tsx
// layout.tsx metadata
export const metadata = {
  title: 'Domačija Tešlan — Sveža ekološka hrana iz Dolenjske',
  description: 'Lokalno pridelani šparglji, jagode, česen in krompir. Obiščite nas v Podgori pri Novem mestu.',
  keywords: 'kmetija, ekološko, šparglji, Dolenjska, Novo mesto, lokalna hrana',
  openGraph: {
    title: 'Domačija Tešlan',
    description: 'Iz naše zemlje, na vašo mizo.',
    locale: 'sl_SI',
  }
};
```

---

## 13. Podatki

### Produkti (data/products.ts)

```typescript
export interface Product {
  id: string;
  name: string;
  description: string;
  season: string;
  status: 'available' | 'soon' | 'autumn';
  statusLabel: string;
  image?: string; // pot do slike, ko bo na voljo
}

export const products: Product[] = [
  {
    id: 'sparglji',
    name: 'Šparglji',
    description: 'Sveži zeleni šparglji, ročno pobrani vsako jutro. Nežen okus, popolni za na žar ali v solato.',
    season: 'April — Junij',
    status: 'available',
    statusLabel: 'Na voljo',
  },
  {
    id: 'jagode',
    name: 'Jagode',
    description: 'Sladke, sočne jagode pridelane brez pesticidov. Popolne za sveže uživanje ali predelavo.',
    season: 'Maj — Julij',
    status: 'soon',
    statusLabel: 'Kmalu',
  },
  {
    id: 'cesen',
    name: 'Česen',
    description: 'Domači česen z intenzivnim okusom. Idealen za kuhanje, kisanje ali kot naravno zdravilo.',
    season: 'September — Oktober',
    status: 'autumn',
    statusLabel: 'Jesen',
  },
  {
    id: 'krompir',
    name: 'Krompir',
    description: 'Domači krompir raznih sort. Odličen za pečenje, kuhanje ali kot priloga.',
    season: 'Avgust — Oktober',
    status: 'autumn',
    statusLabel: 'Jesen',
  },
];
```

### Špargljeve konfiguracije (data/spears.ts)

```typescript
export interface SpearConfig {
  id: string;
  baseX: number;
  baseY: number;
  explodeX: number;
  explodeY: number;
  explodeRotate: number;
  height: number;
  width: number;
  color: string;
  colorDark: string;
  bractsCount: number;
}

export const spears: SpearConfig[] = [
  { id: 'spear-1', baseX: -80, baseY: 20,  explodeX: -320, explodeY: -60,  explodeRotate: -15, height: 380, width: 10, color: '#6ab35a', colorDark: '#5a9e4a', bractsCount: 4 },
  { id: 'spear-2', baseX: -40, baseY: -10, explodeX: -140, explodeY: -80,  explodeRotate: -8,  height: 420, width: 12, color: '#5c9e4e', colorDark: '#4a8c3e', bractsCount: 5 },
  { id: 'spear-3', baseX: 0,   baseY: -30, explodeX: 0,    explodeY: -100, explodeRotate: 2,   height: 450, width: 14, color: '#4e9040', colorDark: '#3d7a32', bractsCount: 5 },
  { id: 'spear-4', baseX: 40,  baseY: 0,   explodeX: 140,  explodeY: -60,  explodeRotate: 10,  height: 400, width: 11, color: '#6aad5c', colorDark: '#5a9e4a', bractsCount: 4 },
  { id: 'spear-5', baseX: 80,  baseY: 15,  explodeX: 320,  explodeY: -40,  explodeRotate: 18,  height: 370, width: 10, color: '#5c9e4e', colorDark: '#4a8c3e', bractsCount: 3 },
];
```

### Kontaktni podatki

```typescript
export const contact = {
  name: 'Sandi Derčar',
  address: 'Podgora 15, 8351 Straža pri Novem mestu',
  phone: '+386 40 578 512',
  phoneDisplay: '040 578 512',
  email: 'sandi.dercar@gmail.com',
  mapsUrl: 'https://www.google.com/maps/place/Podgora+15,+8351+Straža',
  coordinates: { lat: 45.79, lng: 15.13 },
};
```

---

## 14. Vizualna referenca (ASCII layout)

```
┌─────────────────────────────────────────────┐
│  [T] Tešlan     Domov  Izdelki  [Obiščite]  │  ← HEADER (sticky)
├─────────────────────────────────────────────┤
│                                             │
│         Domačija Tešlan — Dolenjska         │
│                                             │
│        Iz naše zemlje,                      │
│        na vašo mizo                         │
│                                             │
│        [Pridite k nam →]  [Naši izdelki]    │
│                                             │
│              ╱╲  ╱╲  ╱╲  ╱╲  ╱╲            │  ← ŠPARGLJI (šop)
│              ││  ││  ││  ││  ││            │
│              ││  ││  ││  ││  ││            │     Ko scrollaš:
│              ││  ││  ││  ││  ││            │     šparglji se
│              ││  ││  ││  ││  ││            │     razpršijo narazen,
│              ││  ││  ││  ││  ││            │     kartice se pojavijo
│                                             │
│         15+ let    100% eko    4km od NM    │
│                                             │
│  (200vh scroll prostor za animacijo)        │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │  ← VREDNOSTI
│  │ Lokalno  │ │  Sveže   │ │Trajnostno│    │
│  │ pridelan │ │          │ │          │    │
│  └──────────┘ └──────────┘ └──────────┘    │
│                                             │
├─────────────────────────────────────────────┤
│  ████████████ TEMNO ZELENO BG ██████████████│  ← IZDELKI
│                                             │
│  ┌──────────────┐  ┌──────────────┐        │
│  │  [Na voljo]  │  │   [Kmalu]    │        │
│  │   ŠPARGLJI   │  │    JAGODE    │        │
│  │  Apr — Jun   │  │  Maj — Jul   │        │
│  └──────────────┘  └──────────────┘        │
│  ┌──────────────┐  ┌──────────────┐        │
│  │    [Jesen]   │  │    [Jesen]   │        │
│  │    ČESEN     │  │   KROMPIR    │        │
│  │  Sep — Okt   │  │  Avg — Okt   │        │
│  └──────────────┘  └──────────────┘        │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  Obiščite nas         ┌────────────────┐    │  ← OBIŠČITE NAS
│  Pridite na           │                │    │
│  Domačijo Tešlan      │  GOOGLE MAPS   │    │
│                       │    EMBED       │    │
│  📍 Podgora 15...     │                │    │
│  📞 040 578 512       └────────────────┘    │
│  📅 Po dogovoru                             │
│                                             │
├─────────────────────────────────────────────┤
│  ███████████ SREDNJE ZELENO BG █████████████│  ← CTA
│                                             │
│       Sveže iz kmetije,                     │
│       danes na vaši mizi                    │
│                                             │
│     [040 578 512]  [Navodila za pot →]      │
│                                             │
├─────────────────────────────────────────────┤
│  [T] Tešlan   Strani     Kontakt           │  ← FOOTER
│  Podgora      Domov      Email             │
│               Izdelki    Telefon           │
│  © 2025       O nas      Maps             │
└─────────────────────────────────────────────┘
```

---

## 15. Animacijski cheat sheet (framer-motion variante)

```typescript
// lib/animations.ts

export const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15 },
  },
};

export const slideInLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: 'easeOut' } },
};

export const slideInRight = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: 'easeOut' } },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

// Za hero page load
export const heroStagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.3 },
  },
};
```

---

## Povzetek za Claude Code

Implementiraj Next.js stran z:
1. Sticky blur header z navigacijo
2. **Hero sekcijo (200vh) s 5 SVG šparglji ki se ob scrollu razpršijo narazen (framer-motion useScroll/useTransform), med njimi se pojavijo info kartice**
3. Vrednosti sekcijo s 3 karticami (scroll reveal)
4. Produktno sekcijo s 4 izdelki na temnem bg (scroll reveal + hover efekti)
5. Obiščite nas s kontaktnimi podatki + Google Maps embed
6. CTA sekcijo z telefonsko in directions gumbom
7. Footer s 3 kolonami

Barve: green-deep/mid/light/bright + cream paleta.
Fonti: DM Serif Display (naslovi) + Manrope (body).
Animacije: framer-motion za vse — scroll-linked na hero, whileInView za ostale sekcije.