import path from "node:path";
import { fileURLToPath } from "node:url";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { sl } from "@payloadcms/translations/languages/sl";
import { buildConfig } from "payload";
import sharp from "sharp";
import { preberiOkolje } from "./env";
import { Mediji } from "./payload/kolekcije/Mediji";
import { Uporabniki } from "./payload/kolekcije/Uporabniki";
import { shrambaSlik } from "./payload/shramba";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Tu se preveri samo oblika spremenljivk. Obvezne v produkciji preveri
// `instrumentation.ts` ob zagonu strežnika, da gradnja (`next build`)
// ne potrebuje skrivnosti.
const env = preberiOkolje(process.env, []);

export default buildConfig({
  serverURL: env.NEXT_PUBLIC_SITE_URL ?? "",
  secret: env.PAYLOAD_SECRET ?? "",
  admin: {
    user: Uporabniki.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: {
      titleSuffix: " — Domačija Tešlan",
      robots: "noindex, nofollow",
    },
    dateFormat: "d. M. yyyy HH:mm",
  },
  // Admin v slovenščini (Z81).
  i18n: {
    supportedLanguages: { sl },
    fallbackLanguage: "sl",
  },
  collections: [Uporabniki, Mediji],
  editor: lexicalEditor(),
  db: postgresAdapter({
    pool: { connectionString: env.DATABASE_URL ?? "" },
    // Shema se spreminja samo z migracijami v `src/migrations` (tudi lokalno),
    // da je enaka v razvoju, testih, na stagingu in v produkciji.
    push: false,
    migrationDir: path.resolve(dirname, "migrations"),
  }),
  upload: {
    limits: { fileSize: 10_000_000 },
  },
  sharp,
  plugins: [shrambaSlik(env)],
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  graphQL: { disable: true },
  telemetry: false,
});
