import type { Field, TextField } from "payload";
import { OBLIKA_SLUGA, ustvariSlug } from "../katalog/slug";

/**
 * Slug (del spletnega naslova), unikaten v zbirki. Če ga urednik pusti
 * praznega, se ustvari iz polja `izPolja` (npr. „Česen v prahu“ →
 * `cesen-v-prahu`).
 */
export function slugPolje(izPolja: string, opis: string): TextField {
  return {
    name: "slug",
    type: "text",
    label: "Spletni naslov (slug)",
    unique: true,
    index: true,
    // Ni `required`: prazno polje v adminu izpolni hook spodaj (iz imena).
    admin: {
      position: "sidebar",
      description: `${opis} Male črke brez šumnikov, besede ločene z vezajem. Če polje pustite prazno, se ustvari samo iz imena.`,
    },
    hooks: {
      beforeValidate: [
        ({ value, data }) => {
          if (typeof value === "string" && value.trim() !== "") return ustvariSlug(value);
          const izvor = data?.[izPolja];
          return typeof izvor === "string" ? ustvariSlug(izvor) : value;
        },
      ],
    },
    validate: (value: string | null | undefined) =>
      !value || OBLIKA_SLUGA.test(value)
        ? true
        : "Uporabite samo male črke brez šumnikov, številke in vezaje (npr. cesen-v-prahu).",
  };
}

/** Vrstni red prikaza: manjša številka je prej. */
export function vrstniRedPolje(kaj: string): Field {
  return {
    name: "vrstniRed",
    type: "number",
    label: "Vrstni red",
    defaultValue: 0,
    required: true,
    admin: {
      position: "sidebar",
      step: 1,
      description: `Po tej številki so ${kaj} razvrščeni na strani: manjša številka je prej. Enake številke se razvrstijo po imenu.`,
    },
    validate: (value: number | null | undefined) =>
      value == null || Number.isInteger(value) ? true : "Vpišite celo število.",
  };
}
