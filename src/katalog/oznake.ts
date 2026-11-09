/**
 * Oznake predpomnilnika Next (`unstable_cache` tags) za podatke iz CMS.
 * Hooki v Payloadu jih ob spremembi razveljavijo (Z17), poizvedbe javnih
 * strani pa jih nosijo. Ločena datoteka, da je hooki uvozijo brez
 * konfiguracije Payloada.
 */
export const OZNAKA_KATALOG = "katalog";
export const OZNAKA_NASTAVITVE = "nastavitve-trgovine";

/** Varovalka, če razveljavitev ne uspe: podatki so stari največ 60 s (Z17). */
export const OSVEZI_PO_SEKUNDAH = 60;
