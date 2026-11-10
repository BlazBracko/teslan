import { opozorilaEposte } from "./eposta/adapter";
import { NapakaOkolja, okolje } from "./env";

/**
 * Preveri okolje; ob napaki izpiše težave (brez vrednosti) in ustavi proces.
 * Opozorila (npr. e-pošta brez Resenda) se le izpišejo.
 */
export function preveriOkoljeObZagonu() {
  try {
    const env = okolje();
    for (const opozorilo of opozorilaEposte(env)) console.warn(opozorilo);
  } catch (napaka) {
    if (napaka instanceof NapakaOkolja) {
      console.error(napaka.message);
      process.exit(1);
    }
    throw napaka;
  }
}
