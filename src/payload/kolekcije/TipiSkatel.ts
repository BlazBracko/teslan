import type { Access, CollectionConfig } from "payload";
import { NAJVEC_MEST } from "../../darila/pravila";
import { OZNAKA_KATALOG } from "../../katalog/oznake";
import { jeUrednikAliAdmin, urednikAliAdmin } from "../dostop";
import { vrstniRedPolje } from "../polja";
import { hookiRevalidacije } from "../revalidacija";

/** Javnost vidi le aktivne škatle; urednik in admin vse. */
const aktivneAliUrednik: Access = ({ req }) =>
  jeUrednikAliAdmin(req.user as never) ? true : { aktiven: { equals: true } };

const celoStevilo = (najmanj: number, sporocilo: string) => (value: number | null | undefined) =>
  value != null && Number.isInteger(value) && value >= najmanj ? true : sporocilo;

/**
 * Tipi darilnih škatel (Z50): škatla z določenim številom mest, svojo ceno
 * (DDV 22 %, P5) in zalogo. Cena darila je cena škatle in vsota izdelkov v
 * njej (P8).
 */
export const TipiSkatel: CollectionConfig = {
  slug: "tipi-skatel",
  labels: { singular: "Tip darilne škatle", plural: "Tipi darilnih škatel" },
  defaultSort: "vrstniRed",
  admin: {
    useAsTitle: "ime",
    defaultColumns: ["ime", "steviloMest", "cenaCenti", "zaloga", "aktiven"],
    group: "Darila",
    description:
      "Škatle, v katere kupci sestavijo darilo. Cena darila je cena škatle in vsota izbranih izdelkov. Ob naročilu se zaloga škatle zmanjša sama.",
  },
  access: {
    read: aktivneAliUrednik,
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
      admin: { description: "Ime, kot ga vidi kupec, npr. „Mala darilna škatla“." },
    },
    {
      name: "opis",
      type: "textarea",
      label: "Opis",
      maxLength: 300,
      admin: { description: "Neobvezno. Ena ali dve povedi o škatli (material, velikost)." },
    },
    {
      name: "slika",
      type: "upload",
      relationTo: "media",
      label: "Slika",
      admin: { description: "Fotografija škatle. Brez slike se pokaže nadomestna ploskev." },
    },
    {
      type: "row",
      fields: [
        {
          name: "steviloMest",
          type: "number",
          label: "Število mest",
          required: true,
          min: 1,
          max: NAJVEC_MEST,
          defaultValue: 3,
          admin: {
            width: "33%",
            step: 1,
            description: `Koliko izdelkov gre v škatlo (1 kos = 1 mesto, največ ${NAJVEC_MEST}). Kupec je ne rabi napolniti do konca.`,
          },
          validate: celoStevilo(1, "Vpišite celo število mest, vsaj 1."),
        },
        {
          name: "cenaCenti",
          type: "number",
          label: "Cena škatle (v centih)",
          required: true,
          min: 0,
          admin: {
            width: "33%",
            step: 1,
            description: "Cena prazne škatle z DDV (22 %) v centih: 500 pomeni 5,00 €. Izdelki se prištejejo.",
          },
          validate: celoStevilo(0, "Cena mora biti celo število centov, 0 ali več."),
        },
        {
          name: "zaloga",
          type: "number",
          label: "Zaloga (kosov)",
          required: true,
          min: 0,
          defaultValue: 0,
          admin: {
            width: "34%",
            step: 1,
            description: "Koliko škatel imate. Ob naročilu se zmanjša sama, ob preklicu se vrne.",
          },
          validate: celoStevilo(0, "Zaloga mora biti celo število, 0 ali več."),
        },
      ],
    },
    {
      name: "aktiven",
      type: "checkbox",
      label: "Aktiven",
      defaultValue: true,
      index: true,
      admin: {
        position: "sidebar",
        description: "Samo aktivne škatle lahko kupci izberejo. Neaktivne niso vidne na strani.",
      },
    },
    vrstniRedPolje("tipi škatel"),
  ],
};
