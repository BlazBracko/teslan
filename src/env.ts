import { z } from "zod";

/**
 * Okoljske spremenljivke (načrt §8). Vse so dokumentirane v `.env.example`.
 *
 * Vsaka spremenljivka je neobvezna, dokler je koda ne potrebuje; če je nastavljena,
 * mora imeti pravilno obliko. Spremenljivke iz `OBVEZNE_V_PRODUKCIJI` morajo biti
 * nastavljene, ko teče produkcijski strežnik (`NODE_ENV=production`), sicer se zagon
 * ustavi z jasnim sporočilom. Vrednosti se v sporočilih o napakah nikoli ne izpišejo.
 */

const prazenVNedoloceno = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

const neobvezno = <T extends z.ZodType>(shema: T) =>
  z.preprocess(prazenVNedoloceno, shema.optional());

const url = z.url({ message: "mora biti veljaven URL" });
const eposta = z.email({ message: "mora biti veljaven e-poštni naslov" });

export const envShema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    // Baza in Payload (uporablja se od K3)
    DATABASE_URL: neobvezno(
      z.string().regex(/^postgres(ql)?:\/\//, {
        message: "mora biti povezava postgres://…",
      }),
    ),
    PAYLOAD_SECRET: neobvezno(
      z.string().min(32, { message: "mora imeti vsaj 32 znakov" }),
    ),

    // Spletno mesto
    NEXT_PUBLIC_SITE_URL: neobvezno(url),
    NOINDEX: neobvezno(
      z.literal("1", { message: "je lahko samo 1 ali nenastavljeno" }),
    ),
    BASIC_AUTH_USER: neobvezno(z.string()),
    BASIC_AUTH_PASSWORD: neobvezno(z.string()),

    // Stripe (K8)
    STRIPE_SECRET_KEY: neobvezno(
      z.string().regex(/^(sk|rk)_(test|live)_/, {
        message: "mora se začeti s sk_test_, sk_live_, rk_test_ ali rk_live_",
      }),
    ),
    STRIPE_WEBHOOK_SECRET: neobvezno(
      z.string().startsWith("whsec_", { message: "mora se začeti z whsec_" }),
    ),

    // E-pošta (K9)
    RESEND_API_KEY: neobvezno(
      z.string().startsWith("re_", { message: "mora se začeti z re_" }),
    ),
    EMAIL_FROM: neobvezno(z.string()),
    EMAIL_REDIRECT_TO: neobvezno(eposta),
    // Samo za teste: brez Resenda se vsaka e-pošta doda še v to datoteko (JSONL).
    EPOSTA_DNEVNIK: neobvezno(z.string()),

    // Blagajna (K7): največ toliko naročil na IP v 10 minutah (privzeto 5, Z26).
    OMEJITEV_NAROCIL_NA_IP: neobvezno(
      z.coerce.number().int().positive({ message: "mora biti pozitivno celo število" }),
    ),

    // Cloudflare R2 prek S3 API (K3)
    S3_BUCKET: neobvezno(z.string()),
    S3_ENDPOINT: neobvezno(url),
    S3_ACCESS_KEY_ID: neobvezno(z.string()),
    S3_SECRET_ACCESS_KEY: neobvezno(z.string()),
    S3_PUBLIC_URL: neobvezno(url),

    // Seed (K4)
    SEED_ADMIN_EMAIL: neobvezno(eposta),
    SEED_ADMIN_PASSWORD: neobvezno(
      z.string().min(12, { message: "mora imeti vsaj 12 znakov" }),
    ),
  })
  .superRefine((env, ctx) => {
    const skupine: Array<[string, Array<keyof typeof env>]> = [
      ["Basic Auth", ["BASIC_AUTH_USER", "BASIC_AUTH_PASSWORD"]],
      [
        "S3/R2",
        [
          "S3_BUCKET",
          "S3_ENDPOINT",
          "S3_ACCESS_KEY_ID",
          "S3_SECRET_ACCESS_KEY",
          "S3_PUBLIC_URL",
        ],
      ],
      ["Stripe", ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"]],
      ["seed", ["SEED_ADMIN_EMAIL", "SEED_ADMIN_PASSWORD"]],
    ];
    for (const [ime, kljuci] of skupine) {
      const nastavljeni = kljuci.filter((k) => env[k] !== undefined);
      if (nastavljeni.length > 0 && nastavljeni.length < kljuci.length) {
        for (const k of kljuci.filter((k) => env[k] === undefined)) {
          ctx.addIssue({
            code: "custom",
            path: [k],
            message: `manjka (skupina ${ime} mora biti nastavljena v celoti ali nič)`,
          });
        }
      }
    }
  });

export type Env = z.infer<typeof envShema>;

/**
 * Spremenljivke, brez katerih produkcijski strežnik ne sme začeti: Payload
 * (admin, katalog, naročila) brez baze in skrivnosti ne deluje.
 */
export const OBVEZNE_V_PRODUKCIJI: ReadonlyArray<keyof Env> = [
  "DATABASE_URL",
  "PAYLOAD_SECRET",
];

export class NapakaOkolja extends Error {
  constructor(public readonly tezave: string[]) {
    super(
      `Neveljavne okoljske spremenljivke:\n${tezave.map((t) => `  - ${t}`).join("\n")}\nGl. .env.example.`,
    );
    this.name = "NapakaOkolja";
  }
}

export function preberiOkolje(
  vir: Record<string, string | undefined> = process.env,
  obvezneVProdukciji: ReadonlyArray<keyof Env> = OBVEZNE_V_PRODUKCIJI,
): Env {
  const rezultat = envShema.safeParse(vir);
  if (!rezultat.success) {
    throw new NapakaOkolja(
      rezultat.error.issues.map(
        (i) => `${i.path.join(".") || "(okolje)"}: ${i.message}`,
      ),
    );
  }
  const env = rezultat.data;
  if (env.NODE_ENV === "production") {
    const manjkajo = obvezneVProdukciji.filter((k) => env[k] === undefined);
    if (manjkajo.length > 0) {
      throw new NapakaOkolja(
        manjkajo.map((k) => `${k}: obvezna v produkciji, a ni nastavljena`),
      );
    }
  }
  return env;
}

let predpomnjeno: Env | undefined;

/** Preverjeno okolje; prvi klic ga prebere iz `process.env`. */
export function okolje(): Env {
  predpomnjeno ??= preberiOkolje();
  return predpomnjeno;
}
