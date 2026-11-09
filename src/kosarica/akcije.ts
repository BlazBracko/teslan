"use server";

import { naloziKatalog, naloziNastavitve } from "@/katalog/podatki";
import { trenutniMesec } from "@/katalog/sezona";
import { normalizirajKosarico } from "./postavke";
import { preveriKosarico, type PregledKosarice } from "./preverjanje";

/**
 * Strežniška akcija za stran košarice (Z21): brskalnik pošlje samo id-je in
 * količine, strežnik vrne cene, zalogo, težave in pravila dostave iz baze.
 * Vnos je nezaupanja vreden; neveljavne postavke se izpustijo.
 */
export async function preveriKosaricoNaStrezniku(vnos: unknown): Promise<PregledKosarice> {
  const kosarica = normalizirajKosarico(vnos);
  const [katalog, nastavitve] = await Promise.all([naloziKatalog(), naloziNastavitve()]);
  return preveriKosarico(
    kosarica,
    katalog.izdelki,
    {
      trgovinaOdprta: nastavitve.trgovinaOdprta !== false,
      postninaCenti: nastavitve.postninaCenti,
      pragBrezplacnePostnineCenti: nastavitve.pragBrezplacnePostnineCenti,
    },
    trenutniMesec(),
  );
}
