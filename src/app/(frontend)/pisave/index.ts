import localFont from "next/font/local";

// Pisavi identitete (Z1): Fraunces za naslove (optična velikost, mehki rezi
// SOFT 50) in Inter za besedilo in vmesnik. Izpostavita se kot CSS
// spremenljivki, ki ju `globals.css` preslika v `--font-display` in
// `--font-sans`; literalno ime družine ne deluje, ker ga next/font hashira.
//
// Hitrost (K13, S18): pisavi gostimo sami, vsako v eni datoteki, omejeni na
// latinico s šumniki in uporabljene teže (`scripts/pripravi-pisave.sh`).
// Skupaj ~120 KB namesto ~425 KB pri Google Fonts, kjer sta podmnožici
// latin in latin-ext z vsemi osmi zamikali glavno sliko (LCP) na mobilnem.
export const fraunces = localFont({
  src: "./fraunces.woff2",
  weight: "400 700",
  display: "swap",
  variable: "--font-fraunces",
  adjustFontFallback: "Times New Roman",
});

export const inter = localFont({
  src: "./inter.woff2",
  weight: "400 700",
  display: "swap",
  variable: "--font-inter",
  adjustFontFallback: "Arial",
});

/** Razreda za `<html>` (javna stran in globalna stran 404). */
export const razrediPisav = `${fraunces.variable} ${inter.variable}`;
