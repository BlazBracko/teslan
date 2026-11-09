import { z } from "zod";

/**
 * Obrazec blagajne (Z25). Ista shema preveri vnos v brskalniku (sporočila
 * ob poljih) in na strežniku (vnos je nezaupanja vreden). Naslov je
 * obvezen samo pri pošti.
 */

export const NAJDALJSA_OPOMBA = 500;

/** Skrito polje za robote (Z26); človek ga ne vidi in ne izpolni. */
export const IME_PASTI = "spletnaStran";

const besedilo = (sporocilo: string, najvec = 100) =>
  z
    .string({ error: sporocilo })
    .trim()
    .min(1, { error: sporocilo })
    .max(najvec, { error: `Največ ${najvec} znakov.` });

const osnovnaShema = z
  .object({
    ime: besedilo("Vpišite ime."),
    priimek: besedilo("Vpišite priimek."),
    email: z
      .string({ error: "Vpišite e-poštni naslov." })
      .trim()
      .min(1, { error: "Vpišite e-poštni naslov." })
      .max(200, { error: "Največ 200 znakov." })
      .pipe(z.email({ error: "Vpišite veljaven e-poštni naslov, npr. ime@primer.si." })),
    telefon: z
      .string({ error: "Vpišite telefonsko številko." })
      .trim()
      .min(1, { error: "Vpišite telefonsko številko." })
      .regex(/^\+?[\d\s/().-]{6,20}$/, { error: "Vpišite veljavno telefonsko številko, npr. 040 123 456." })
      .refine((t) => t.replace(/\D/g, "").length >= 6, {
        error: "Vpišite veljavno telefonsko številko, npr. 040 123 456.",
      }),
    nacinDostave: z.enum(["prevzem", "posta"], { error: "Izberite način dostave." }),
    nacinPlacila: z.enum(["kartica", "ob-prevzemu"], { error: "Izberite način plačila." }),
    ulica: z.string().trim().max(200, { error: "Največ 200 znakov." }).optional(),
    postnaStevilka: z.string().trim().optional(),
    kraj: z.string().trim().max(100, { error: "Največ 100 znakov." }).optional(),
    opomba: z
      .string()
      .trim()
      .max(NAJDALJSA_OPOMBA, { error: `Opomba je lahko dolga največ ${NAJDALJSA_OPOMBA} znakov.` })
      .optional(),
    soglasje: z.literal(true, { error: "Za oddajo naročila se morate strinjati s splošnimi pogoji." }),
  });

/**
 * Naslov pri pošti. Preveri se tudi, ko so druga polja napačna (zod
 * objektovih pravil ne izvede, dokler polja niso veljavna), da kupec vidi
 * vse napake hkrati.
 */
function preveriNaslov(v: { nacinDostave?: unknown; ulica?: unknown; postnaStevilka?: unknown; kraj?: unknown }) {
  const tezave: Array<{ polje: "ulica" | "postnaStevilka" | "kraj"; sporocilo: string }> = [];
  if (v.nacinDostave !== "posta") return tezave;
  const niz = (x: unknown) => (typeof x === "string" ? x.trim() : "");
  const ulica = niz(v.ulica);
  if (!ulica) tezave.push({ polje: "ulica", sporocilo: "Vpišite ulico in hišno številko." });
  else if (!/\d/.test(ulica)) tezave.push({ polje: "ulica", sporocilo: "Dodajte še hišno številko." });
  if (!/^\d{4}$/.test(niz(v.postnaStevilka))) {
    tezave.push({ polje: "postnaStevilka", sporocilo: "Poštna številka ima 4 števke, npr. 8351." });
  }
  if (!niz(v.kraj)) tezave.push({ polje: "kraj", sporocilo: "Vpišite kraj." });
  return tezave;
}

export const blagajnaShema = osnovnaShema.superRefine((v, ctx) => {
  for (const t of preveriNaslov(v)) ctx.addIssue({ code: "custom", path: [t.polje], message: t.sporocilo });
});

export type PodatkiBlagajne = z.infer<typeof osnovnaShema>;
export type PoljeBlagajne = keyof PodatkiBlagajne;

export type NapakeBlagajne = Partial<Record<PoljeBlagajne, string>>;

/**
 * Preveri obrazec blagajne in vrne podatke ali napake po poljih (prva za
 * vsako polje). Napake naslova se pokažejo tudi, ko so napačna druga polja.
 */
export function preveriBlagajno(
  vnos: unknown,
): { success: true; data: PodatkiBlagajne } | { success: false; napake: NapakeBlagajne } {
  const rezultat = blagajnaShema.safeParse(vnos);
  if (rezultat.success) return { success: true, data: rezultat.data };
  const napake: NapakeBlagajne = {};
  for (const tezava of rezultat.error.issues) {
    const polje = tezava.path[0] as PoljeBlagajne | undefined;
    if (polje && !napake[polje]) napake[polje] = tezava.message;
  }
  const surovo = typeof vnos === "object" && vnos !== null ? vnos : {};
  for (const t of preveriNaslov(surovo)) napake[t.polje] ??= t.sporocilo;
  return { success: false, napake };
}
