import { expect, test } from "@playwright/test";

// Z4: brez NOINDEX=1 (produkcija) slogovni vodnik ne obstaja.
test("slogovni vodnik v produkciji vrne 404", async ({ request }) => {
  const odziv = await request.get("/styleguide");
  expect(odziv.status()).toBe(404);
});
