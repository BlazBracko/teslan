import { revalidateTag } from "next/cache";
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
  PayloadRequest,
} from "payload";

/**
 * On-demand revalidacija (Z17): ob vsaki spremembi v adminu se razveljavijo
 * podatki z dano oznako, zato javne strani spremembo pokažejo ob naslednjem
 * ogledu. `OSVEZI_PO_SEKUNDAH` v `src/katalog/oznake.ts` je varovalka.
 *
 * Zunaj strežnika Next (seed, migracije, Vitest) predpomnilnika ni in
 * `revalidateTag` vrže napako; tam se razveljavitev preskoči. Seed jo izklopi
 * tudi izrecno s `context.brezRevalidacije`.
 */
export function razveljavi(oznaka: string, req: Pick<PayloadRequest, "context" | "payload">) {
  if (req.context?.brezRevalidacije) return;
  try {
    // `expire: 0`: naslednja zahteva dobi sveže podatke, ne starih iz ozadja.
    revalidateTag(oznaka, { expire: 0 });
  } catch (napaka) {
    if (napaka instanceof Error && napaka.message.includes("static generation store missing")) {
      return;
    }
    req.payload.logger.error({ err: napaka, oznaka }, "Revalidacija ni uspela");
  }
}

export const razveljaviObSpremembi =
  (oznaka: string): CollectionAfterChangeHook =>
  ({ doc, req }) => {
    razveljavi(oznaka, req);
    return doc;
  };

export const razveljaviObIzbrisu =
  (oznaka: string): CollectionAfterDeleteHook =>
  ({ doc, req }) => {
    razveljavi(oznaka, req);
    return doc;
  };

export const razveljaviGlobal =
  (oznaka: string): GlobalAfterChangeHook =>
  ({ doc, req }) => {
    razveljavi(oznaka, req);
    return doc;
  };

/** Hooki za zbirko, katere vsebina se kaže na javnih straneh. */
export const hookiRevalidacije = (oznaka: string) => ({
  afterChange: [razveljaviObSpremembi(oznaka)],
  afterDelete: [razveljaviObIzbrisu(oznaka)],
});
