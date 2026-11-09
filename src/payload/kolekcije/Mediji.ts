import path from "node:path";
import type { CollectionConfig } from "payload";
import { urednikAliAdmin, vsi } from "../dostop";

/**
 * Slike (Z83). Datoteke gredo v Cloudflare R2, ko so nastavljene S3
 * spremenljivke (gl. `payload.config.ts`), sicer na lokalni disk (`media/`).
 */
export const Mediji: CollectionConfig = {
  slug: "media",
  labels: { singular: "Medij", plural: "Mediji" },
  admin: {
    useAsTitle: "alt",
    group: "Vsebina",
    description: "Slike izdelkov, skupin ponudbe in darilnih škatel.",
  },
  access: {
    read: vsi,
    create: urednikAliAdmin,
    update: urednikAliAdmin,
    delete: urednikAliAdmin,
  },
  upload: {
    // Lokalni disk (razvoj, testi); z R2 se ne uporablja.
    staticDir: path.resolve(process.cwd(), "media"),
    mimeTypes: ["image/*"],
    focalPoint: true,
  },
  fields: [
    {
      name: "alt",
      type: "text",
      label: "Opis slike (alt)",
      required: true,
      admin: {
        description:
          "Kratek opis, kaj je na sliki, npr. „Šopek zelenih špargljev na leseni mizi“. Bralniki zaslona ga preberejo slepim in slabovidnim; obvezen.",
      },
    },
  ],
};
