import type { NacinDostave } from "@/kosarica/cene";

/**
 * Statusi naročila in dovoljeni prehodi (Z33). Admin drug prehod zavrne z
 * napako (S5). Ista status → isti status ni prehod in je vedno dovoljen
 * (npr. ponovno shranjevanje preklicanega naročila, Z34).
 */

export const STATUSI = ["caka-placilo", "novo", "pripravljeno", "poslano", "zakljuceno", "preklicano"] as const;
export type StatusNarocila = (typeof STATUSI)[number];

export const OZNAKE_STATUSOV: Record<StatusNarocila, string> = {
  "caka-placilo": "Čaka na plačilo",
  novo: "Novo",
  pripravljeno: "Pripravljeno za prevzem",
  poslano: "Poslano",
  zakljuceno: "Zaključeno",
  preklicano: "Preklicano",
};

export const PREHODI: Record<StatusNarocila, readonly StatusNarocila[]> = {
  "caka-placilo": ["novo", "preklicano"],
  novo: ["pripravljeno", "poslano", "preklicano"],
  pripravljeno: ["zakljuceno", "preklicano"],
  poslano: ["zakljuceno"],
  zakljuceno: [],
  preklicano: [],
};

export class NapakaPrehoda extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NapakaPrehoda";
  }
}

export function jeStatus(v: unknown): v is StatusNarocila {
  return typeof v === "string" && (STATUSI as readonly string[]).includes(v);
}

/**
 * Razlog, zakaj prehod ni dovoljen, ali `null`, če je. „Pripravljeno za
 * prevzem“ ima smisel le pri prevzemu, „Poslano“ le pri pošti.
 */
export function razlogNedovoljenegaPrehoda(
  od: StatusNarocila,
  na: StatusNarocila,
  nacinDostave?: NacinDostave | null,
): string | null {
  if (od === na) return null;
  if (!PREHODI[od].includes(na)) {
    const dovoljeni = PREHODI[od].map((s) => `„${OZNAKE_STATUSOV[s]}“`);
    return `Iz statusa „${OZNAKE_STATUSOV[od]}“ ni mogoče preiti v „${OZNAKE_STATUSOV[na]}“.${
      dovoljeni.length ? ` Dovoljeno: ${dovoljeni.join(", ")}.` : " Status je končen."
    }`;
  }
  if (na === "pripravljeno" && nacinDostave === "posta") {
    return "Naročilo se pošlje po pošti, zato ne more biti „Pripravljeno za prevzem“. Izberite „Poslano“.";
  }
  if (na === "poslano" && nacinDostave === "prevzem") {
    return "Naročilo se prevzame na kmetiji, zato ne more biti „Poslano“. Izberite „Pripravljeno za prevzem“.";
  }
  return null;
}

/** Vrže `NapakaPrehoda`, če prehod ni dovoljen (S5). */
export function preveriPrehod(od: StatusNarocila, na: StatusNarocila, nacinDostave?: NacinDostave | null): void {
  const razlog = razlogNedovoljenegaPrehoda(od, na, nacinDostave);
  if (razlog) throw new NapakaPrehoda(razlog);
}

/** Začetni status novega naročila: kartica čaka na Stripe, ob prevzemu je takoj „Novo“ (Z43). */
export function zacetniStatus(nacinPlacila: "kartica" | "ob-prevzemu"): StatusNarocila {
  return nacinPlacila === "kartica" ? "caka-placilo" : "novo";
}
