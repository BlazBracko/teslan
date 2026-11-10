import type { GlobalConfig } from "payload";
import { OZNAKA_NASTAVITVE } from "../../katalog/oznake";
import { jeAdmin, samoAdmin } from "../dostop";
import { razveljaviGlobal } from "../revalidacija";

/** Privzete vrednosti (§6); seed jih zapiše ob prvem zagonu. */
export const PRIVZETE_NASTAVITVE = {
  trgovinaOdprta: true,
  postninaCenti: 500,
  pragBrezplacnePostnineCenti: 5000,
  emailObvestil: "sandi.dercar@gmail.com",
} as const;

const celoNenegativno = (value: unknown) =>
  typeof value === "number" && Number.isInteger(value) && value >= 0
    ? true
    : "Vpišite celo število centov, 0 ali več.";

/**
 * Nastavitve trgovine (§6). Ureja jih samo administrator (Z80); javne strani
 * jih berejo na strežniku prek lokalnega API-ja.
 */
export const NastavitveTrgovine: GlobalConfig = {
  slug: "nastavitve-trgovine",
  label: "Nastavitve trgovine",
  admin: {
    group: "Nastavitve",
    description: "Poštnina, stikalo trgovine, e-pošta za obvestila in podatki prodajalca.",
    hidden: ({ user }) => !jeAdmin(user as never),
  },
  access: {
    read: samoAdmin,
    update: samoAdmin,
  },
  hooks: {
    afterChange: [razveljaviGlobal(OZNAKA_NASTAVITVE)],
  },
  fields: [
    {
      name: "trgovinaOdprta",
      type: "checkbox",
      label: "Trgovina je odprta",
      defaultValue: PRIVZETE_NASTAVITVE.trgovinaOdprta,
      admin: {
        description:
          "Ko je izklopljeno, je katalog še viden, gumbi za nakup pa so skriti in blagajna ne sprejema naročil (npr. med dopustom).",
      },
    },
    {
      type: "row",
      fields: [
        {
          name: "postninaCenti",
          type: "number",
          label: "Poštnina (v centih)",
          required: true,
          defaultValue: PRIVZETE_NASTAVITVE.postninaCenti,
          admin: {
            width: "50%",
            step: 1,
            description: "Cena pošiljanja z DDV v centih: 500 pomeni 5,00 €. Pri prevzemu je poštnina 0.",
          },
          validate: celoNenegativno,
        },
        {
          name: "pragBrezplacnePostnineCenti",
          type: "number",
          label: "Brezplačna poštnina od (v centih)",
          required: true,
          defaultValue: PRIVZETE_NASTAVITVE.pragBrezplacnePostnineCenti,
          admin: {
            width: "50%",
            step: 1,
            description:
              "Če je vrednost izdelkov v košarici vsaj toliko, je poštnina 0. 5000 pomeni 50,00 €.",
          },
          validate: celoNenegativno,
        },
      ],
    },
    {
      name: "emailObvestil",
      type: "email",
      label: "E-pošta za obvestila",
      required: true,
      defaultValue: PRIVZETE_NASTAVITVE.emailObvestil,
      admin: {
        description:
          "Na ta naslov pride obvestilo o vsakem novem naročilu. Kupci, ki odgovorijo na potrdilo, pišejo sem.",
      },
    },
    {
      name: "navodilaZaPrevzem",
      type: "textarea",
      label: "Navodila za prevzem",
      admin: {
        description:
          "Besedilo za kupce, ki izberejo prevzem na kmetiji (kje, kdaj, kako se dogovorijo). Prikazano na potrdilu in v e-pošti.",
      },
    },
    {
      name: "prodajalec",
      type: "group",
      label: "Podatki prodajalca",
      admin: {
        description:
          "Prikazani v splošnih pogojih, politiki zasebnosti in na potrdilu. Prazna polja so na pravnih straneh označena z [manjka: …].",
      },
      fields: [
        {
          name: "naziv",
          type: "text",
          label: "Naziv",
          admin: { description: "Uradni naziv nosilca kmetije, npr. „Sandi Derčar, nosilec kmetije“." },
        },
        {
          name: "naslov",
          type: "text",
          label: "Naslov",
          admin: { description: "Naslov kmetije, ki je tudi prevzemno mesto." },
        },
        {
          type: "row",
          fields: [
            {
              name: "davcnaStevilka",
              type: "text",
              label: "Davčna številka",
              admin: { width: "33%", description: "Npr. SI12345678." },
            },
            {
              name: "maticnaStevilka",
              type: "text",
              label: "Matična številka",
              admin: { width: "33%", description: "Če obstaja." },
            },
            {
              name: "kmgMid",
              type: "text",
              label: "KMG-MID",
              admin: { width: "34%", description: "Identifikacijska številka kmetijskega gospodarstva." },
            },
          ],
        },
        {
          type: "row",
          fields: [
            {
              name: "telefon",
              type: "text",
              label: "Telefon",
              admin: { width: "50%", description: "Telefon za kupce, npr. 040 578 512." },
            },
            {
              name: "email",
              type: "email",
              label: "E-pošta",
              admin: { width: "50%", description: "Javni e-naslov za kupce." },
            },
          ],
        },
        {
          type: "row",
          fields: [
            {
              name: "geoSirina",
              type: "number",
              label: "Zemljepisna širina",
              min: -90,
              max: 90,
              admin: {
                width: "50%",
                step: 0.000001,
                description:
                  "Lega kmetije za iskalnike (Google), npr. 45.7756. V Google Maps desni klik na kmetijo pokaže obe številki. Prazno: lega se ne objavi.",
              },
            },
            {
              name: "geoDolzina",
              type: "number",
              label: "Zemljepisna dolžina",
              min: -180,
              max: 180,
              admin: {
                width: "50%",
                step: 0.000001,
                description: "Druga številka iz Google Maps, npr. 15.0937. Izpolnite obe ali nobene.",
              },
            },
          ],
        },
      ],
    },
  ],
};
