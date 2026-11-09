import type { Access, FieldAccess, PayloadRequest } from "payload";

/**
 * Vloge v adminu (Z80):
 *  - `admin`: vse, tudi nastavitve trgovine in drugi uporabniki,
 *  - `urednik`: vsebina trgovine (izdelki, kategorije, mediji, darila,
 *    naročila brez brisanja) in lasten uporabniški račun.
 */
export const VLOGE = ["admin", "urednik"] as const;
export type Vloga = (typeof VLOGE)[number];

type Uporabnik = { id: number | string; vloga?: Vloga | null } | null | undefined;

const uporabnikIz = (req: Pick<PayloadRequest, "user">): Uporabnik =>
  req.user as Uporabnik;

export function jeAdmin(uporabnik: Uporabnik): boolean {
  return uporabnik?.vloga === "admin";
}

/** Prijavljen uporabnik z eno od vlog (admin ali urednik). */
export function jeUrednikAliAdmin(uporabnik: Uporabnik): boolean {
  return uporabnik?.vloga === "admin" || uporabnik?.vloga === "urednik";
}

/** Dostop na ravni zbirke: samo admin. */
export const samoAdmin: Access = ({ req }) => jeAdmin(uporabnikIz(req));

/** Dostop na ravni zbirke: admin ali urednik. */
export const urednikAliAdmin: Access = ({ req }) =>
  jeUrednikAliAdmin(uporabnikIz(req));

/** Dostop za vse, tudi neprijavljene (javna stran). */
export const vsi: Access = () => true;

/** Admin vidi vse zapise, urednik samo svojega (uporabniški račun). */
export const adminAliSam: Access = ({ req }) => {
  const uporabnik = uporabnikIz(req);
  if (jeAdmin(uporabnik)) return true;
  if (!uporabnik) return false;
  return { id: { equals: uporabnik.id } };
};

/** Dostop na ravni polja: samo admin. */
export const poljeSamoAdmin: FieldAccess = ({ req }) =>
  jeAdmin(uporabnikIz(req));
