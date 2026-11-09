/**
 * Next.js ob zagonu strežnika pokliče `register()`. Tu preverimo okoljske
 * spremenljivke, da se strežnik z napačno nastavitvijo ustavi takoj in z jasnim
 * sporočilom (načrt §8), namesto da bi vračal napake 500.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { okolje, NapakaOkolja } = await import("./env");
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
