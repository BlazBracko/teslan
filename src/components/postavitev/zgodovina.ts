/**
 * Zadnja obiskana stran znotraj aplikacije (samo v brskalniku). Glava jo
 * beleži ob vsaki menjavi poti; „Nazaj“ na podstrani izdelka jo uporabi,
 * da ve, ali lahko kupca vrne na prejšnjo stran (z ohranjenim filtrom in
 * položajem), ali pa ga mora poslati na seznam, ker je prišel od drugod
 * (iskalnik, deljena povezava).
 */
let trenutna: string | null = null;
let prejsnja: string | null = null;

export function zabeleziPot(pot: string) {
  if (pot === trenutna) return;
  prejsnja = trenutna;
  trenutna = pot;
}

export function imaPrejsnjoStran(): boolean {
  return prejsnja !== null;
}
