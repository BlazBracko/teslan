import { NapakaOkolja, okolje } from "./env";

/** Preveri okolje; ob napaki izpiše težave (brez vrednosti) in ustavi proces. */
export function preveriOkoljeObZagonu() {
  try {
    okolje();
  } catch (napaka) {
    if (napaka instanceof NapakaOkolja) {
      console.error(napaka.message);
      process.exit(1);
    }
    throw napaka;
  }
}
