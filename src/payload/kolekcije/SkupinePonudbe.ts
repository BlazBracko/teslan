import type { CollectionConfig } from "payload";
import { OZNAKA_KATALOG } from "../../katalog/oznake";
import { urednikAliAdmin, vsi } from "../dostop";
import { vrstniRedPolje } from "../polja";
import { hookiRevalidacije } from "../revalidacija";

/**
 * Skupine ponudbe na domači strani (Z16): nekaj ploščic, ki združijo
 * kategorije tako, kot ljudje razmišljajo o hrani (sveže, začimbe, sladko …).
 */
export const SkupinePonudbe: CollectionConfig = {
  slug: "skupine-ponudbe",
  labels: { singular: "Skupina ponudbe", plural: "Skupine ponudbe" },
  defaultSort: "vrstniRed",
  admin: {
    useAsTitle: "ime",
    defaultColumns: ["ime", "kategorije", "vrstniRed"],
    group: "Ponudba",
    description:
      "Ploščice v razdelku „Naša ponudba“ na domači strani. Cena „od X €“ se izračuna sama iz izdelkov v izbranih kategorijah.",
  },
  access: {
    read: vsi,
    create: urednikAliAdmin,
    update: urednikAliAdmin,
    delete: urednikAliAdmin,
  },
  hooks: hookiRevalidacije(OZNAKA_KATALOG),
  fields: [
    {
      name: "ime",
      type: "text",
      label: "Ime",
      required: true,
      admin: { description: "Naslov ploščice, npr. „Začimbe in posušeno“." },
    },
    {
      name: "opis",
      type: "textarea",
      label: "Opis",
      maxLength: 300,
      admin: {
        description:
          "Ena ali dve povedi o tem, kaj je v skupini, z imeni izdelkov (največ 300 znakov).",
      },
    },
    {
      name: "slika",
      type: "upload",
      relationTo: "media",
      label: "Slika",
      admin: {
        description: "Fotografija na ploščici. Brez slike se pokaže mirna nadomestna ploskev.",
      },
    },
    {
      name: "kategorije",
      type: "relationship",
      relationTo: "kategorije",
      hasMany: true,
      label: "Kategorije",
      admin: {
        description:
          "Kategorije izdelkov, ki spadajo v to skupino. Iz njihovih naročljivih izdelkov se izračuna najnižja cena.",
      },
    },
    vrstniRedPolje("skupine"),
  ],
};
