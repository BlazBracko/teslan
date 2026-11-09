import { APIError, type CollectionConfig } from "payload";
import { OZNAKA_KATALOG } from "../../katalog/oznake";
import { urednikAliAdmin, vsi } from "../dostop";
import { slugPolje, vrstniRedPolje } from "../polja";
import { hookiRevalidacije } from "../revalidacija";

/** Kategorije izdelkov za filter na `/products` (Z14). */
export const Kategorije: CollectionConfig = {
  slug: "kategorije",
  labels: { singular: "Kategorija", plural: "Kategorije" },
  defaultSort: "vrstniRed",
  admin: {
    useAsTitle: "ime",
    defaultColumns: ["ime", "slug", "vrstniRed"],
    group: "Ponudba",
    description:
      "Kategorije izdelkov, po katerih kupci filtrirajo stran Izdelki (npr. Začimbe, Olja).",
  },
  access: {
    read: vsi,
    create: urednikAliAdmin,
    update: urednikAliAdmin,
    delete: urednikAliAdmin,
  },
  hooks: {
    ...hookiRevalidacije(OZNAKA_KATALOG),
    beforeDelete: [
      async ({ id, req }) => {
        // Izdelek mora imeti kategorijo; brez tega bi baza brisanje zavrnila
        // z nerazumljivo napako.
        const { totalDocs } = await req.payload.count({
          collection: "izdelki",
          where: { kategorija: { equals: id } },
          req,
        });
        if (totalDocs > 0) {
          throw new APIError(
            `Kategorije ni mogoče izbrisati, ker so v njej še izdelki (${totalDocs}). Najprej jih premaknite v drugo kategorijo.`,
            400,
            undefined,
            true,
          );
        }
      },
    ],
  },
  fields: [
    {
      name: "ime",
      type: "text",
      label: "Ime",
      required: true,
      admin: { description: "Ime kategorije, kot ga vidi kupec, npr. „Začimbe“." },
    },
    slugPolje("ime", "Uporablja se v filtru na strani Izdelki (?kategorija=…)."),
    vrstniRedPolje("kategorije"),
  ],
};
