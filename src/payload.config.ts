import path from "node:path";
import { fileURLToPath } from "node:url";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { sl } from "@payloadcms/translations/languages/sl";
import { buildConfig, type CollectionConfig, type GlobalConfig } from "payload";
import sharp from "sharp";
import { adapterEposte } from "./eposta/adapter";
import { preberiOkolje } from "./env";
import { NastavitveTrgovine } from "./payload/globali/NastavitveTrgovine";
import { Izdelki } from "./payload/kolekcije/Izdelki";
import { Kategorije } from "./payload/kolekcije/Kategorije";
import { Mediji } from "./payload/kolekcije/Mediji";
import { DarilniProgrami } from "./payload/kolekcije/DarilniProgrami";
import { Narocila } from "./payload/kolekcije/Narocila";
import { SkupinePonudbe } from "./payload/kolekcije/SkupinePonudbe";
import { TipiSkatel } from "./payload/kolekcije/TipiSkatel";
import { Uporabniki } from "./payload/kolekcije/Uporabniki";
import { shrambaSlik } from "./payload/shramba";

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Zavihek „API“ (surovi JSON dokumenta) je za razvijalce; lastnika bi le
 * zmedel. REST API ostane, kot je.
 */
function brezZavihkaAPI<T extends CollectionConfig | GlobalConfig>(config: T): T {
  return { ...config, admin: { ...config.admin, hideAPIURL: true } };
}

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
      icons: [{ rel: "icon", type: "image/png", url: "/logo.png" }],
      // Admin ni za deljenje; brez Payloadove slike in končne točke /api/og.
      defaultOGImageType: "off",
    },
    dateFormat: "d. M. yyyy HH:mm",
    // Prijazen admin za lastnika (gl. `src/payload/admin/`): vedno svetla
    // tema v barvah kmetije (`app/(payload)/custom.css`), brez Gravatarja
    // (ne pošilja e-pošte tretjim), lastna nadzorna plošča in pomoč.
    theme: "light",
    avatar: "default",
    components: {
      graphics: {
        Logo: "/payload/admin/Logotip#Logotip",
        Icon: "/payload/admin/Ikona#Ikona",
      },
      beforeNavLinks: ["/payload/admin/PovezaveVNavigaciji#PovezaveNaVrhu"],
      afterNavLinks: ["/payload/admin/PovezaveVNavigaciji#PovezaveNaDnu"],
      views: {
        dashboard: { Component: "/payload/admin/NadzornaPlosca#NadzornaPlosca" },
        pomoc: {
          Component: "/payload/admin/Pomoc#Pomoc",
          path: "/pomoc",
          exact: true,
          meta: { title: "Pomoč" },
        },
      },
    },
  },
  // Admin v slovenščini (Z81).
  i18n: {
    supportedLanguages: { sl },
    fallbackLanguage: "sl",
  },
  collections: [Narocila, Izdelki, Kategorije, SkupinePonudbe, DarilniProgrami, TipiSkatel, Mediji, Uporabniki].map(
    brezZavihkaAPI,
  ),
  globals: [NastavitveTrgovine].map(brezZavihkaAPI),
  editor: lexicalEditor(),
  // Resend, če je `RESEND_API_KEY` nastavljen, sicer izpis v log (Z58);
  // z `EMAIL_REDIRECT_TO` gre vsa pošta na en naslov (staging).
  email: adapterEposte(env),
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
