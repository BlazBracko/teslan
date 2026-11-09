import type { CollectionConfig } from "payload";
import {
  adminAliSam,
  jeAdmin,
  poljeSamoAdmin,
  samoAdmin,
  VLOGE,
  type Vloga,
} from "../dostop";

const OZNAKE_VLOG: Record<Vloga, string> = {
  admin: "Administrator",
  urednik: "Urednik",
};

/**
 * Uporabniki admina (Z80). Prvi uporabnik (obrazec ob prvem zagonu ali seed)
 * je vedno admin; vse nadaljnje ustvari admin. Urednik vidi in ureja samo
 * svoj račun in si vloge ne more spremeniti.
 */
export const Uporabniki: CollectionConfig = {
  slug: "users",
  labels: { singular: "Uporabnik", plural: "Uporabniki" },
  auth: {
    // Seja admina je nujen piškotek (Z60).
    cookies: { sameSite: "Lax" },
  },
  admin: {
    useAsTitle: "ime",
    defaultColumns: ["ime", "email", "vloga"],
    group: "Nastavitve",
    description: "Osebe, ki se lahko prijavijo v admin.",
    // Urednik do seznama uporabnikov nima dostopa, svoj račun ureja v
    // meniju „Račun“.
    hidden: ({ user }) => !jeAdmin(user as never),
  },
  access: {
    read: adminAliSam,
    create: samoAdmin,
    update: adminAliSam,
    delete: samoAdmin,
  },
  fields: [
    {
      name: "ime",
      type: "text",
      label: "Ime in priimek",
      required: true,
      admin: { description: "Prikazano v adminu, npr. „Sandi Derčar“." },
    },
    {
      name: "email",
      type: "email",
      label: "E-pošta",
      required: true,
      unique: true,
      admin: { description: "Uporablja se za prijavo in ponastavitev gesla." },
    },
    {
      name: "vloga",
      type: "select",
      label: "Vloga",
      required: true,
      defaultValue: "urednik",
      options: VLOGE.map((v) => ({ value: v, label: OZNAKE_VLOG[v] })),
      saveToJWT: true,
      access: { create: poljeSamoAdmin, update: poljeSamoAdmin },
      admin: {
        // Na obrazcu za prvega uporabnika (še nihče ni prijavljen) polja ni:
        // prvi uporabnik je vedno administrator (gl. hook spodaj).
        condition: (_data, _siblingData, { user }) => Boolean(user),
        description:
          "Administrator ureja vse, tudi nastavitve trgovine in uporabnike. Urednik ureja izdelke, darila, medije in naročila ter svoj račun.",
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        // Prvi uporabnik mora biti admin, sicer nihče ne more urejati
        // nastavitev in drugih uporabnikov.
        if (operation === "create") {
          const { totalDocs } = await req.payload.count({
            collection: "users",
            overrideAccess: true,
            req,
          });
          if (totalDocs === 0) return { ...data, vloga: "admin" };
        }
        return data;
      },
    ],
  },
};
