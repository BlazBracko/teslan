import { naloziNastavitve } from "@/katalog/podatki";
import { kontaktIzNastavitev } from "@/lib/kontakt";
import { pravniPodatkiProdajalca } from "./prodajalec";

/** Mesec zadnje vsebinske spremembe pravnih besedil (prikaz na straneh). */
export const POSODOBLJENO = "november 2026";

/** Podatki, ki jih potrebujejo pravne strani (iz nastavitev trgovine). */
export async function naloziPravnePodatke() {
  const nastavitve = await naloziNastavitve();
  return {
    nastavitve,
    prodajalec: pravniPodatkiProdajalca(nastavitve.prodajalec),
    kontakt: kontaktIzNastavitev(nastavitve.prodajalec),
  };
}
