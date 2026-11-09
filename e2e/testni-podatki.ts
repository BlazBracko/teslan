/**
 * Podatki, ki jih potrebujejo samo e2e testi, poleg seeda (zagon iz
 * `e2e/priprava.ts` prek `payload run`):
 *  - neobjavljen izdelek `skriti-izdelek` (S14: podstran vrne 404, na
 *    seznamu ga ni),
 *  - objavljen izdelek `malo-zaloge` z zalogo 2 (K6: košarica z več kosi,
 *    kot jih je na zalogi). Drugi testi ga ne uporabljajo.
 */
import { getPayload } from "payload";
import config from "../src/payload.config";

const SKRITI_IZDELEK = { ime: "Skriti testni izdelek", slug: "skriti-izdelek" };
const MALO_ZALOGE = { ime: "Testni izdelek z malo zaloge", slug: "malo-zaloge" };

const payload = await getPayload({ config });
let izhod = 0;
try {
  const kategorija = await payload.find({ collection: "kategorije", limit: 1, sort: "vrstniRed" });
  await payload.create({
    collection: "izdelki",
    data: {
      ...SKRITI_IZDELEK,
      objavljen: false,
      vrstniRed: 9999,
      kategorija: kategorija.docs[0].id,
      kratekOpis: "Ta izdelek ni objavljen in ga obiskovalci ne smejo videti.",
      nacinProdaje: "posta-in-prevzem",
      stopnjaDDV: "9.5",
      velikosti: [{ oznaka: "1 kos", cenaCenti: 100, zaloga: 5 }],
    },
    context: { brezRevalidacije: true },
  });
  await payload.create({
    collection: "izdelki",
    data: {
      ...MALO_ZALOGE,
      objavljen: true,
      vrstniRed: 9998,
      kategorija: kategorija.docs[0].id,
      kratekOpis: "Testni izdelek s samo dvema kosoma na zalogi.",
      nacinProdaje: "posta-in-prevzem",
      stopnjaDDV: "9.5",
      velikosti: [{ oznaka: "1 kos", cenaCenti: 900, zaloga: 2 }],
    },
    context: { brezRevalidacije: true },
  });
} catch (napaka) {
  payload.logger.error({ err: napaka }, "Testni podatki niso uspeli");
  izhod = 1;
} finally {
  await payload.destroy();
}
process.exit(izhod);
