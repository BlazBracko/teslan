/**
 * Ali blagajna ponudi plačilo s kartico. Kartično plačilo prek Stripe
 * Checkout doda K8; do takrat (in pozneje brez Stripe ključev) je možnost
 * vidna, a onemogočena, zato je tudi pošta (samo kartica, Z22) ne more
 * oddati.
 */
export function karticaNaVoljo(): boolean {
  return false;
}
