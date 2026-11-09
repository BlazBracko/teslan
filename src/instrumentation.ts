/**
 * Next.js ob zagonu strežnika pokliče `register()`. Tu preverimo okoljske
 * spremenljivke, da se strežnik z napačno nastavitvijo ustavi takoj in z jasnim
 * sporočilom (načrt §8), namesto da bi vračal napake 500.
 *
 * Preverjanje je v ločeni datoteki, ki se naloži samo v Node.js okolju
 * (`process.exit` v Edge okolju ne obstaja).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { preveriOkoljeObZagonu } = await import("./instrumentation-node");
    preveriOkoljeObZagonu();
  }
}
