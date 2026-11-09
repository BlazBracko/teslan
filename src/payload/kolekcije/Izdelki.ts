import type { Access, CollectionConfig } from "payload";
import { OZNAKA_KATALOG } from "../../katalog/oznake";
import {
  preveriCeno,
  preveriPrimernoZaDarilo,
  preveriSezono,
  preveriZalogo,
} from "../../katalog/pravila-izdelka";
import { NACINI_PRODAJE, OZNAKE_NACINOV, type NacinProdaje } from "../../katalog/razpolozljivost";
import { MESECI } from "../../katalog/sezona";
import { STOPNJE_DDV } from "../../katalog/ddv";
import { jeUrednikAliAdmin, urednikAliAdmin } from "../dostop";
import { slugPolje, vrstniRedPolje } from "../polja";
import { hookiRevalidacije } from "../revalidacija";

/** Javnost vidi le objavljene izdelke (Z14); urednik in admin vse. */
const objavljeniAliUrednik: Access = ({ req }) =>
  jeUrednikAliAdmin(req.user as never) ? true : { objavljen: { equals: true } };

const MOZNOSTI_MESECEV = MESECI.map((ime, i) => ({
  value: String(i + 1),
  label: ime.charAt(0).toUpperCase() + ime.slice(1),
}));

type PodatkiIzdelka = { nacinProdaje?: NacinProdaje | null } | undefined;
const nacinIz = (data: unknown) => (data as PodatkiIzdelka)?.nacinProdaje;

/**
 * Izdelki (§6, Z10–Z12, Z52). Vsak ima en način prodaje in eno ali več
 * velikosti s ceno in zalogo. Denar je v celih centih.
 */
export const Izdelki: CollectionConfig = {
  slug: "izdelki",
  labels: { singular: "Izdelek", plural: "Izdelki" },
  defaultSort: "vrstniRed",
  admin: {
    useAsTitle: "ime",
    // Z82: ime, kategorija, način prodaje, objavljen, skupna zaloga.
    defaultColumns: ["ime", "kategorija", "nacinProdaje", "objavljen", "skupnaZaloga"],
    listSearchableFields: ["ime", "slug"],
    group: "Ponudba",
    description:
      "Vsi izdelki kmetije. Na strani so vidni le objavljeni; spremembe se pokažejo v največ minuti.",
  },
  access: {
    read: objavljeniAliUrednik,
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
      admin: { description: "Ime izdelka, kot ga vidi kupec, npr. „Česen v prahu“." },
    },
    slugPolje("ime", "Naslov podstrani izdelka: /products/<slug>."),
    {
      name: "objavljen",
      type: "checkbox",
      label: "Objavljen",
      defaultValue: false,
      index: true,
      admin: {
        position: "sidebar",
        description:
          "Samo objavljeni izdelki so vidni na strani. Neobjavljen izdelek ni viden nikjer, njegova podstran vrne napako 404.",
      },
    },
    {
      name: "izpostavljen",
      type: "checkbox",
      label: "Izpostavljen na domači strani",
      defaultValue: false,
      admin: {
        position: "sidebar",
        description: "Izpostavljeni izdelki so posebej prikazani na domači strani.",
      },
    },
    vrstniRedPolje("izdelki"),
    {
      name: "kategorija",
      type: "relationship",
      relationTo: "kategorije",
      label: "Kategorija",
      required: true,
      admin: { description: "Kategorija, v kateri je izdelek na strani Izdelki." },
    },
    {
      name: "kratekOpis",
      type: "textarea",
      label: "Kratek opis",
      maxLength: 160,
      admin: {
        description:
          "Ena ali dve povedi na kartici izdelka in v iskalnikih (največ 160 znakov).",
      },
    },
    {
      name: "opis",
      type: "richText",
      label: "Dolg opis",
      admin: { description: "Neobvezen daljši opis na podstrani izdelka." },
    },
    {
      type: "row",
      fields: [
        {
          name: "sestavine",
          type: "textarea",
          label: "Sestavine",
          admin: {
            width: "50%",
            description: "Neobvezno. Če je vpisano, je prikazano na podstrani izdelka.",
          },
        },
        {
          name: "alergeni",
          type: "textarea",
          label: "Alergeni",
          admin: {
            width: "50%",
            description: "Neobvezno, npr. „Vsebuje gluten.“ Prikazano na podstrani izdelka.",
          },
        },
      ],
    },
    {
      name: "slike",
      type: "upload",
      relationTo: "media",
      hasMany: true,
      label: "Slike",
      admin: {
        description:
          "Prva slika je glavna (kartica, deljenje na omrežjih). Brez slik se pokaže nadomestna ploskev.",
      },
    },
    {
      name: "nacinProdaje",
      type: "select",
      label: "Način prodaje",
      required: true,
      defaultValue: "posta-in-prevzem",
      options: NACINI_PRODAJE.map((value) => ({ value, label: OZNAKE_NACINOV[value] })),
      admin: {
        description:
          "Pošta in prevzem: kupec izbere pošiljanje ali prevzem. Samo prevzem: npr. jajca in sveža zelenjava. Samo prikaz: izdelek je viden, a ga ni mogoče naročiti (cena in zaloga nista potrebni).",
      },
    },
    {
      name: "sezona",
      type: "group",
      label: "Sezona",
      admin: {
        description:
          "Neobvezno. Izdelek s sezono je naročljiv le v teh mesecih, mesec pred začetkom ima oznako „Kmalu“. Sezona lahko prelije čez novo leto (npr. november–februar). Prazno pomeni vse leto.",
      },
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "od",
              type: "select",
              label: "Od meseca",
              options: MOZNOSTI_MESECEV,
              admin: { width: "50%", description: "Prvi mesec sezone." },
              validate: (value: unknown, { siblingData }: { siblingData: unknown }) =>
                preveriSezono(value, (siblingData as { do?: unknown })?.do),
            },
            {
              name: "do",
              type: "select",
              label: "Do meseca",
              options: MOZNOSTI_MESECEV,
              admin: { width: "50%", description: "Zadnji mesec sezone (vključno)." },
              validate: (value: unknown, { siblingData }: { siblingData: unknown }) =>
                preveriSezono((siblingData as { od?: unknown })?.od, value),
            },
          ],
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "stopnjaDDV",
          type: "select",
          label: "Stopnja DDV",
          required: true,
          defaultValue: "9.5",
          options: STOPNJE_DDV.map((s) => ({ value: s.vrednost, label: s.oznaka })),
          admin: {
            width: "50%",
            description: "Cene so z DDV. Živila: 9,5 %. Na potrdilu se DDV izkaže po stopnjah.",
          },
        },
        {
          name: "primernoZaDarilo",
          type: "checkbox",
          label: "Primerno za darilno škatlo",
          defaultValue: false,
          admin: {
            width: "50%",
            description:
              "Izdelek se lahko izbere v darilni škatli. Dovoljeno samo pri načinu „Pošta in prevzem na kmetiji“.",
          },
          validate: (value: unknown, { data }: { data: unknown }) =>
            preveriPrimernoZaDarilo(value, nacinIz(data)),
        },
      ],
    },
    {
      name: "velikosti",
      type: "array",
      label: "Velikosti",
      labels: { singular: "Velikost", plural: "Velikosti" },
      required: true,
      minRows: 1,
      admin: {
        description:
          "Vsaj ena velikost oz. pakiranje. Vsaka ima svojo ceno in zalogo; kupec izbere eno od njih.",
        initCollapsed: false,
      },
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "oznaka",
              type: "text",
              label: "Oznaka",
              required: true,
              admin: {
                width: "40%",
                description: "Pakiranje, kot ga vidi kupec, npr. „106 ml (40 g)“ ali „šopek 0,5 kg“.",
              },
            },
            {
              name: "cenaCenti",
              type: "number",
              label: "Cena (v centih)",
              admin: {
                width: "30%",
                step: 1,
                description: "Cena z DDV v centih: 550 pomeni 5,50 €. Pri „Samo prikaz“ neobvezno.",
              },
              validate: (value: unknown, { data }: { data: unknown }) =>
                preveriCeno(value, nacinIz(data)),
            },
            {
              name: "zaloga",
              type: "number",
              label: "Zaloga (kosov)",
              admin: {
                width: "30%",
                step: 1,
                description:
                  "Koliko kosov lahko kupci še naročijo. Ob naročilu se zmanjša sama. Pri „Samo prikaz“ neobvezno.",
              },
              validate: (value: unknown, { data }: { data: unknown }) =>
                preveriZalogo(value, nacinIz(data)),
            },
          ],
        },
      ],
    },
    {
      name: "skupnaZaloga",
      type: "number",
      label: "Skupna zaloga",
      virtual: true,
      admin: {
        readOnly: true,
        position: "sidebar",
        description: "Vsota zalog vseh velikosti (izračunano, ni za urejanje).",
      },
      hooks: {
        afterRead: [
          ({ siblingData }) =>
            ((siblingData?.velikosti ?? []) as Array<{ zaloga?: number | null }>).reduce(
              (vsota, v) => vsota + (v.zaloga ?? 0),
              0,
            ),
        ],
      },
    },
  ],
};
