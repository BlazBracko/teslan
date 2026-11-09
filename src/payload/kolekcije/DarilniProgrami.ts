import { ValidationError, type Access, type CollectionBeforeChangeHook, type CollectionConfig } from "payload";
import { NAJVEC_MEST, poisciVelikost, preveriProgram, type IzdelekZaDarilo } from "../../darila/pravila";
import { OZNAKA_KATALOG } from "../../katalog/oznake";
import { jeUrednikAliAdmin, urednikAliAdmin } from "../dostop";
import { slugPolje, vrstniRedPolje } from "../polja";
import { hookiRevalidacije } from "../revalidacija";

/** Javnost vidi le objavljene programe; urednik in admin vse. */
const objavljeniAliUrednik: Access = ({ req }) =>
  jeUrednikAliAdmin(req.user as never) ? true : { objavljen: { equals: true } };

type Relacija = number | { id: number } | null | undefined;
const idRelacije = (v: Relacija) => (typeof v === "object" && v ? v.id : (v ?? null));

type VrsticaVsebine = { izdelek?: Relacija; velikostId?: string | null; kolicina?: number | null };

/**
 * Z51: ob shranjevanju se preveri, da je vsota količin največ toliko, kot
 * ima škatla mest, in da so vsi izdelki primerni za darilo. Velikost lahko
 * urednik vpiše z oznako (npr. „41 ml (15 g)“) ali pusti prazno (prva
 * velikost); shrani se id velikosti.
 */
const preveriVsebino: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  const vsebina = (data.vsebina ?? originalDoc?.vsebina ?? []) as VrsticaVsebine[];
  const tipId = idRelacije(data.tipSkatle ?? originalDoc?.tipSkatle);
  const izdelekIds = [...new Set(vsebina.map((v) => idRelacije(v.izdelek)).filter((id): id is number => id != null))];

  const [tip, izdelki] = await Promise.all([
    tipId != null
      ? req.payload.findByID({ collection: "tipi-skatel", id: tipId, depth: 0, req, disableErrors: true })
      : null,
    izdelekIds.length > 0
      ? req.payload.find({
          collection: "izdelki",
          where: { id: { in: izdelekIds } },
          depth: 0,
          pagination: false,
          req,
        })
      : { docs: [] },
  ]);
  const poId = new Map<number, IzdelekZaDarilo>(
    izdelki.docs.map((i) => [
      i.id,
      {
        id: i.id,
        ime: i.ime,
        nacinProdaje: i.nacinProdaje,
        primernoZaDarilo: Boolean(i.primernoZaDarilo),
        velikosti: i.velikosti.map((v) => ({ id: v.id ?? "", oznaka: v.oznaka })),
      },
    ]),
  );

  const napake = preveriProgram(
    vsebina.map((v) => ({
      izdelekId: idRelacije(v.izdelek),
      velikost: v.velikostId ?? null,
      kolicina: v.kolicina ?? null,
    })),
    tip?.steviloMest ?? null,
    poId,
  );
  if (tipId == null || !tip) napake.unshift({ pot: "tipSkatle", sporocilo: "Izberite tip škatle." });
  if (napake.length > 0) {
    throw new ValidationError({
      collection: "darilni-programi",
      errors: napake.map((n) => ({ path: n.pot, message: n.sporocilo })),
      req,
    });
  }

  // Oznaka ali prazno → id velikosti.
  data.vsebina = vsebina.map((v) => {
    const izdelek = poId.get(idRelacije(v.izdelek) as number)!;
    return { ...v, velikostId: poisciVelikost(izdelek, v.velikostId)!.id };
  });
  return data;
};

/**
 * Darilni programi (Z51, T5): pripravljene škatle z vsebino, ki jih kupec
 * izbere na `/darila` in v konfiguratorju po želji spremeni.
 */
export const DarilniProgrami: CollectionConfig = {
  slug: "darilni-programi",
  labels: { singular: "Darilni program", plural: "Darilni programi" },
  defaultSort: "vrstniRed",
  admin: {
    useAsTitle: "ime",
    defaultColumns: ["ime", "tipSkatle", "objavljen", "vrstniRed"],
    group: "Darila",
    description:
      "Pripravljena darila na strani Darila. Kupec program izbere in vsebino po želji spremeni. Izdelki morajo biti primerni za darilo, skupna količina pa največ toliko, kot ima škatla mest.",
  },
  access: {
    read: objavljeniAliUrednik,
    create: urednikAliAdmin,
    update: urednikAliAdmin,
    delete: urednikAliAdmin,
  },
  hooks: {
    ...hookiRevalidacije(OZNAKA_KATALOG),
    beforeChange: [preveriVsebino],
  },
  fields: [
    {
      name: "ime",
      type: "text",
      label: "Ime",
      required: true,
      admin: { description: "Ime darila, kot ga vidi kupec, npr. „Okusi Dolenjske“." },
    },
    slugPolje("ime", "Naslov konfiguratorja s tem programom: /darila/sestavi?program=<slug>."),
    {
      name: "objavljen",
      type: "checkbox",
      label: "Objavljen",
      defaultValue: false,
      index: true,
      admin: { position: "sidebar", description: "Samo objavljeni programi so vidni na strani Darila." },
    },
    vrstniRedPolje("programi"),
    {
      name: "opis",
      type: "textarea",
      label: "Opis",
      maxLength: 400,
      admin: { description: "Nekaj povedi o darilu: komu je namenjeno, kaj je v njem." },
    },
    {
      name: "slika",
      type: "upload",
      relationTo: "media",
      label: "Slika",
      admin: { description: "Fotografija darila. Brez slike se pokaže nadomestna ploskev." },
    },
    {
      name: "tipSkatle",
      type: "relationship",
      relationTo: "tipi-skatel",
      label: "Tip škatle",
      // Ni `required` v bazi, da izbris škatle ne zruši programa; obvezen je ob shranjevanju (hook).
      admin: { description: "Obvezno. V kateri škatli je darilo. Število mest omejuje skupno količino izdelkov." },
    },
    {
      name: "vsebina",
      type: "array",
      label: "Vsebina",
      labels: { singular: "Izdelek", plural: "Izdelki" },
      required: true,
      minRows: 1,
      maxRows: NAJVEC_MEST,
      admin: {
        description:
          "Izdelki v škatli. Na strani se pokažejo le tisti, ki so na zalogi in v sezoni; ostale kupec vidi kot odstranjene.",
        initCollapsed: false,
      },
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "izdelek",
              type: "relationship",
              relationTo: "izdelki",
              label: "Izdelek",
              // Ni `required` v bazi, da izbris izdelka ne zruši programa; obvezen je ob shranjevanju (hook).
              filterOptions: { primernoZaDarilo: { equals: true } },
              admin: { width: "45%", description: "Samo izdelki, primerni za darilno škatlo." },
            },
            {
              name: "velikostId",
              type: "text",
              label: "Velikost",
              admin: {
                width: "35%",
                description:
                  "Oznaka velikosti, npr. „41 ml (15 g)“; prazno pomeni prvo velikost. Ob shranjevanju se zamenja z notranjo oznako, izbrana velikost je izpisana spodaj.",
              },
            },
            {
              name: "kolicina",
              type: "number",
              label: "Količina",
              required: true,
              defaultValue: 1,
              min: 1,
              admin: { width: "20%", step: 1, description: "Kosov te velikosti." },
            },
          ],
        },
        {
          name: "izbranaVelikost",
          type: "text",
          label: "Izbrana velikost",
          virtual: true,
          admin: { readOnly: true, description: "Velikost, ki je shranjena v programu." },
          hooks: {
            afterRead: [
              async ({ siblingData, req }) => {
                const velikostId = siblingData?.velikostId as string | undefined;
                let izdelek = siblingData?.izdelek as Relacija | { velikosti?: Array<{ id?: string | null; oznaka: string }> };
                if (!velikostId || izdelek == null) return null;
                if (typeof izdelek === "number") {
                  // Samo v adminu (prijavljen urednik); javna stran bere z izpolnjenimi relacijami.
                  if (!req.user) return null;
                  izdelek = await req.payload.findByID({ collection: "izdelki", id: izdelek, depth: 0, req, disableErrors: true });
                }
                const velikosti = (izdelek as { velikosti?: Array<{ id?: string | null; oznaka: string }> } | null)?.velikosti;
                return velikosti?.find((v) => v.id === velikostId)?.oznaka ?? null;
              },
            ],
          },
        },
      ],
    },
  ],
};
