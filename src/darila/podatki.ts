import config from "@payload-config";
import { unstable_cache } from "next/cache";
import { getPayload } from "payload";
import { okolje } from "@/env";
import { OSVEZI_PO_SEKUNDAH, OZNAKA_KATALOG } from "@/katalog/oznake";
import { darilaSTestnimiSlikami, testneSlikeVklopljene } from "@/katalog/testne-slike";
import { programPogled, tipSkatlePogled, type Darila } from "./pogled";

export type { Darila, ProgramPogled, TipSkatlePogled } from "./pogled";

/**
 * Aktivni tipi škatel in objavljeni programi za javne strani (Z50, Z51).
 * Predpomnjeno z oznako kataloga: sprememba škatel, programov ali izdelkov
 * (in vsako naročilo, ki spremeni zalogo) jih razveljavi (Z17).
 */
async function preberiDarila(): Promise<Darila> {
  const payload = await getPayload({ config });
  // Kot neprijavljen obiskovalec: neaktivne škatle in neobjavljeni programi niso vidni.
  const kot = { overrideAccess: false, depth: 1, pagination: false, sort: ["vrstniRed", "ime"] };
  const [tipi, programi] = await Promise.all([
    payload.find({ collection: "tipi-skatel", ...kot }),
    payload.find({ collection: "darilni-programi", ...kot }),
  ]);
  const darila: Darila = {
    tipi: tipi.docs.map(tipSkatlePogled),
    programi: programi.docs.map(programPogled),
  };
  // Staging brez R2: prazni okvirji dobijo testne slike (gl. testne-slike.ts).
  return testneSlikeVklopljene(okolje()) ? darilaSTestnimiSlikami(darila) : darila;
}

export const naloziDarila = unstable_cache(preberiDarila, ["darila-v1"], {
  tags: [OZNAKA_KATALOG],
  revalidate: OSVEZI_PO_SEKUNDAH,
});
