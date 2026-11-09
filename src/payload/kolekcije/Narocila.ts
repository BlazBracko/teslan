import {
  ValidationError,
  type CollectionAfterChangeHook,
  type CollectionBeforeChangeHook,
  type CollectionConfig,
  type Field,
  type FieldAccess,
} from "payload";
import { OZNAKA_KATALOG } from "../../katalog/oznake";
import { formatirajCeno } from "../../lib/denar";
import { oznaciZalogoVrnjeno, povecajZalogo, sejaBaze } from "../../narocila/baza";
import { ponudnikPlacil } from "../../narocila/placila";
import { OZNAKE_STATUSOV, razlogNedovoljenegaPrehoda, STATUSI, type StatusNarocila } from "../../narocila/statusi";
import { urednikAliAdmin } from "../dostop";
import { razveljavi } from "../revalidacija";

/**
 * Naročila (§6, Z30–Z35, T7). Nastanejo samo ob oddaji na blagajni
 * (`src/narocila/oddaja.ts`, lokalni API). V adminu jih ni mogoče ustvariti
 * ne izbrisati (Z35); urednik in admin spreminjata le status, plačilo,
 * številko pošiljke, razlog preklica in interno opombo. Vsa ostala polja so
 * posnetek ob oddaji in so zaklenjena.
 */

/** Polje, ki ga po oddaji ne more spremeniti nihče (lokalni API strežnika ga lahko). */
const zaklenjeno: FieldAccess = () => false;
const samoBranje = { update: zaklenjeno };

const centi = (name: string, label: string, opis: string): Field => ({
  name,
  type: "number",
  label,
  required: true,
  access: samoBranje,
  admin: { readOnly: true, step: 1, description: opis },
});

type PostavkaZaZalogo = { tip?: string | null; izdelek?: number | { id: number } | null; velikostId?: string | null; kolicina?: number | null };

const idRelacije = (v: number | { id: number } | null | undefined) => (typeof v === "object" && v ? v.id : v);

/**
 * Prehodi statusov (Z33) in vračanje zaloge ob preklicu (Z34). Zaloga se
 * vrne v isti transakciji kot shranjevanje; `oznaciZalogoVrnjeno` poskrbi,
 * da se to zgodi natanko enkrat, tudi ob sočasnih shranjevanjih.
 */
const prehodInPreklic: CollectionBeforeChangeHook = async ({ data, originalDoc, operation, req }) => {
  if (operation !== "update" || !originalDoc) return data;
  const od = originalDoc.status as StatusNarocila;
  const na = (data.status ?? od) as StatusNarocila;
  const razlog = razlogNedovoljenegaPrehoda(od, na, originalDoc.nacinDostave);
  if (razlog) {
    throw new ValidationError({ collection: "narocila", errors: [{ path: "status", message: razlog }], req });
  }

  if (na === "preklicano") {
    const seja = await sejaBaze(req.payload, req);
    if (await oznaciZalogoVrnjeno(seja, originalDoc.id)) {
      const postavke = (originalDoc.postavke ?? []) as PostavkaZaZalogo[];
      await povecajZalogo(
        seja,
        postavke.flatMap((p) => {
          const izdelekId = idRelacije(p.izdelek);
          return p.tip === "izdelek" && izdelekId && p.velikostId && p.kolicina
            ? [{ izdelekId, velikostId: p.velikostId, kolicina: p.kolicina }]
            : [];
        }),
      );
      req.context.zalogaVrnjena = true;
    }
    // Sicer bi shranjevanje prepisalo oznako, ki jo je pravkar nastavil SQL.
    data.zalogaVrnjena = true;
  }
  return data;
};

/**
 * Če naročilo, ki čaka na plačilo s kartico, prekliče Sandi v adminu, se
 * seja Stripe Checkout takoj izteče, da kupec ne more plačati preklicanega
 * naročila (Z42). Preklici iz obdelave plačil (`context.brezStripa`) sejo
 * že imajo potečeno. Napaka Stripa shranjevanja ne ustavi.
 */
const iztekSejeObPreklicu: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req }) => {
  if (
    operation === "update" &&
    previousDoc?.status === "caka-placilo" &&
    doc.status === "preklicano" &&
    doc.stripeSessionId &&
    !req.context.brezStripa
  ) {
    try {
      await ponudnikPlacil()?.prekiniSejo(doc.stripeSessionId);
    } catch (napaka) {
      req.payload.logger.error({ err: napaka, narocilo: doc.stevilka }, "Seje Stripe ob preklicu ni bilo mogoče izteči");
    }
  }
  return doc;
};

export const Narocila: CollectionConfig = {
  slug: "narocila",
  labels: { singular: "Naročilo", plural: "Naročila" },
  defaultSort: "-createdAt",
  admin: {
    useAsTitle: "stevilka",
    // T7: številka, datum, kupec, dostava, plačilo, plačano, skupaj, status.
    defaultColumns: ["stevilka", "createdAt", "kupecPrikaz", "nacinDostave", "nacinPlacila", "placano", "skupaj", "status"],
    listSearchableFields: ["stevilka", "kupec.priimek", "kupec.email"],
    group: "Trgovina",
    description:
      "Naročila s spletne strani, najnovejša zgoraj. Filtrirate jih lahko po statusu. Spremenite lahko status, plačilo, številko pošiljke in interno opombo; ob preklicu se zaloga vrne sama.",
    pagination: { defaultLimit: 50 },
  },
  access: {
    read: urednikAliAdmin,
    // Naročila nastanejo le na blagajni (lokalni API).
    create: () => false,
    update: urednikAliAdmin,
    // Z35: naročila ni mogoče izbrisati.
    delete: () => false,
  },
  hooks: {
    beforeChange: [prehodInPreklic],
    afterChange: [
      ({ doc, req }) => {
        if (req.context.zalogaVrnjena) razveljavi(OZNAKA_KATALOG, req);
        return doc;
      },
      iztekSejeObPreklicu,
    ],
  },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "stevilka",
          type: "text",
          label: "Številka",
          required: true,
          unique: true,
          index: true,
          access: samoBranje,
          admin: { readOnly: true, width: "50%", description: "Številka naročila, npr. T-2026-0001." },
        },
        {
          name: "status",
          type: "select",
          label: "Status",
          required: true,
          defaultValue: "novo",
          index: true,
          options: STATUSI.map((value) => ({ value, label: OZNAKE_STATUSOV[value] })),
          admin: {
            width: "50%",
            description:
              "Novo → Pripravljeno za prevzem (prevzem) ali Poslano (pošta) → Zaključeno. Preklic vrne zalogo. Drugi prehodi niso mogoči.",
          },
        },
      ],
    },
    {
      name: "zeton",
      type: "text",
      label: "Žeton",
      required: true,
      // Žeton odpre stran naročila brez prijave; v adminu in API ni viden.
      access: { read: zaklenjeno, update: zaklenjeno },
      admin: { hidden: true },
    },
    {
      type: "row",
      fields: [
        {
          name: "nacinDostave",
          type: "select",
          label: "Dostava",
          required: true,
          options: [
            { value: "prevzem", label: "Prevzem na kmetiji" },
            { value: "posta", label: "Pošta" },
          ],
          access: samoBranje,
          admin: { readOnly: true, width: "33%", description: "Kako kupec dobi naročilo." },
        },
        {
          name: "nacinPlacila",
          type: "select",
          label: "Plačilo",
          required: true,
          options: [
            { value: "kartica", label: "Kartica" },
            { value: "ob-prevzemu", label: "Ob prevzemu" },
          ],
          access: samoBranje,
          admin: { readOnly: true, width: "33%", description: "Kako kupec plača." },
        },
        {
          name: "placano",
          type: "checkbox",
          label: "Plačano",
          defaultValue: false,
          admin: {
            width: "34%",
            description:
              "Pri kartici se označi samo, ko Stripe potrdi plačilo. Pri plačilu ob prevzemu ga označite, ko kupec plača.",
          },
        },
      ],
    },
    {
      name: "kupecPrikaz",
      type: "text",
      label: "Kupec",
      virtual: true,
      admin: { hidden: true },
      hooks: {
        afterRead: [
          ({ siblingData }) =>
            [siblingData?.kupec?.ime, siblingData?.kupec?.priimek].filter(Boolean).join(" ") || null,
        ],
      },
    },
    {
      name: "skupaj",
      type: "text",
      label: "Skupaj",
      virtual: true,
      admin: { hidden: true },
      hooks: {
        afterRead: [
          ({ siblingData }) =>
            typeof siblingData?.skupajCenti === "number" ? formatirajCeno(siblingData.skupajCenti) : null,
        ],
      },
    },
    {
      name: "kupec",
      type: "group",
      label: "Kupec",
      access: samoBranje,
      admin: { description: "Podatki, ki jih je kupec vpisal na blagajni." },
      fields: [
        {
          type: "row",
          fields: [
            { name: "ime", type: "text", label: "Ime", required: true, admin: { readOnly: true, width: "50%" } },
            { name: "priimek", type: "text", label: "Priimek", required: true, admin: { readOnly: true, width: "50%" } },
          ],
        },
        {
          type: "row",
          fields: [
            { name: "email", type: "email", label: "E-pošta", required: true, admin: { readOnly: true, width: "50%" } },
            { name: "telefon", type: "text", label: "Telefon", required: true, admin: { readOnly: true, width: "50%" } },
          ],
        },
      ],
    },
    {
      name: "naslov",
      type: "group",
      label: "Naslov za pošiljanje",
      access: samoBranje,
      admin: {
        description: "Samo pri pošti.",
        condition: (data) => data?.nacinDostave === "posta",
      },
      fields: [
        { name: "ulica", type: "text", label: "Ulica in hišna številka", admin: { readOnly: true } },
        {
          type: "row",
          fields: [
            { name: "postnaStevilka", type: "text", label: "Poštna številka", admin: { readOnly: true, width: "30%" } },
            { name: "kraj", type: "text", label: "Kraj", admin: { readOnly: true, width: "70%" } },
          ],
        },
      ],
    },
    {
      name: "darilo",
      type: "checkbox",
      label: "Darilo",
      defaultValue: false,
      access: samoBranje,
      admin: {
        readOnly: true,
        description: "Paket gre na naslov prejemnika: potrdila in cen ne prilagajte paketu.",
        condition: (data) => Boolean(data?.darilo),
      },
    },
    {
      name: "prejemnik",
      type: "group",
      label: "Prejemnik darila",
      access: samoBranje,
      admin: { condition: (data) => Boolean(data?.darilo) },
      fields: [
        { name: "ime", type: "text", label: "Ime in priimek", admin: { readOnly: true } },
        { name: "ulica", type: "text", label: "Ulica in hišna številka", admin: { readOnly: true } },
        { name: "postnaStevilka", type: "text", label: "Poštna številka", admin: { readOnly: true } },
        { name: "kraj", type: "text", label: "Kraj", admin: { readOnly: true } },
      ],
    },
    {
      name: "opomba",
      type: "textarea",
      label: "Opomba kupca",
      access: samoBranje,
      admin: { readOnly: true, description: "Npr. želeni termin prevzema." },
    },
    {
      name: "postavke",
      type: "array",
      label: "Postavke",
      labels: { singular: "Postavka", plural: "Postavke" },
      required: true,
      minRows: 1,
      access: samoBranje,
      admin: {
        readOnly: true,
        description: "Posnetek imen, velikosti, cen in DDV ob oddaji; poznejše spremembe izdelkov ga ne spremenijo.",
      },
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "tip",
              type: "select",
              label: "Vrsta",
              required: true,
              defaultValue: "izdelek",
              options: [
                { value: "izdelek", label: "Izdelek" },
                { value: "skatla", label: "Darilna škatla" },
              ],
              admin: { width: "20%" },
            },
            { name: "ime", type: "text", label: "Ime", required: true, admin: { width: "40%" } },
            { name: "velikost", type: "text", label: "Velikost", admin: { width: "40%" } },
          ],
        },
        {
          type: "row",
          fields: [
            { name: "kolicina", type: "number", label: "Količina", required: true, admin: { width: "25%" } },
            {
              name: "cenaCenti",
              type: "number",
              label: "Cena kosa (v centih)",
              required: true,
              admin: { width: "25%", description: "Z DDV." },
            },
            { name: "stopnjaDDV", type: "number", label: "DDV (%)", required: true, admin: { width: "25%" } },
          ],
        },
        {
          type: "row",
          fields: [
            {
              name: "izdelek",
              type: "relationship",
              relationTo: "izdelki",
              label: "Izdelek",
              admin: { width: "50%" },
            },
            {
              name: "velikostId",
              type: "text",
              label: "Id velikosti",
              admin: { width: "50%", description: "Za vračanje zaloge ob preklicu." },
            },
          ],
        },
      ],
    },
    {
      type: "row",
      fields: [
        centi("vmesniSestevekCenti", "Vmesni seštevek (v centih)", "Vsota postavk z DDV."),
        centi("postninaCenti", "Poštnina (v centih)", "0 pri prevzemu in nad pragom brezplačne poštnine."),
        centi("skupajCenti", "Skupaj (v centih)", "Znesek, ki ga plača kupec."),
      ],
    },
    {
      name: "ddv",
      type: "array",
      label: "DDV po stopnjah",
      labels: { singular: "Stopnja", plural: "Stopnje" },
      access: samoBranje,
      admin: { readOnly: true, description: "DDV, vključen v znesek, po stopnjah (poštnina 22 %)." },
      fields: [
        {
          type: "row",
          fields: [
            { name: "stopnja", type: "number", label: "Stopnja (%)", required: true, admin: { width: "33%" } },
            { name: "osnovaCenti", type: "number", label: "Osnova (v centih)", required: true, admin: { width: "33%" } },
            { name: "ddvCenti", type: "number", label: "DDV (v centih)", required: true, admin: { width: "34%" } },
          ],
        },
      ],
    },
    {
      name: "soglasjePogoji",
      type: "date",
      label: "Soglasje s pogoji",
      required: true,
      access: samoBranje,
      admin: {
        readOnly: true,
        date: { pickerAppearance: "dayAndTime" },
        description: "Kdaj je kupec potrdil splošne pogoje.",
      },
    },
    {
      name: "stevilkaPosiljke",
      type: "text",
      label: "Številka pošiljke",
      admin: {
        description: "Neobvezno. Kupec jo dobi v obvestilu, ko naročilo označite kot poslano.",
        condition: (data) => data?.nacinDostave === "posta",
      },
    },
    {
      name: "razlogPreklica",
      type: "text",
      label: "Razlog preklica",
      admin: {
        description: "Neobvezno. Zapišite ga, ko naročilo prekličete.",
        condition: (data) => data?.status === "preklicano",
      },
    },
    {
      name: "internaOpomba",
      type: "textarea",
      label: "Interna opomba",
      admin: { description: "Samo za vas; kupec je ne vidi." },
    },
    {
      type: "collapsible",
      label: "Tehnični podatki",
      admin: { initCollapsed: true, position: "sidebar" },
      fields: [
        {
          name: "zalogaVrnjena",
          type: "checkbox",
          label: "Zaloga vrnjena",
          defaultValue: false,
          access: samoBranje,
          admin: { readOnly: true, description: "Označi se samo ob preklicu, ko se zaloga vrne." },
        },
        {
          name: "napakaEposte",
          type: "textarea",
          label: "Napaka pri pošiljanju e-pošte",
          access: samoBranje,
          admin: { readOnly: true, description: "Če obvestilo kupcu ali vam ni bilo poslano, je razlog tukaj." },
        },
        {
          name: "stripeSessionId",
          type: "text",
          label: "Stripe seja",
          index: true,
          access: samoBranje,
          admin: { readOnly: true, description: "Samo pri plačilu s kartico." },
        },
        {
          name: "stripePaymentIntentId",
          type: "text",
          label: "Stripe plačilo",
          access: samoBranje,
          admin: { readOnly: true, description: "Za iskanje plačila v Stripu (npr. za vračilo)." },
        },
      ],
    },
  ],
};
