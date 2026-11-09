import { describe, expect, it } from "vitest";
import { NapakaPrehoda, PREHODI, preveriPrehod, razlogNedovoljenegaPrehoda, STATUSI, zacetniStatus } from "./statusi";

describe("prehodi statusov (Z33, S5)", () => {
  const dovoljeni: Array<[string, string]> = [
    ["caka-placilo", "novo"],
    ["caka-placilo", "preklicano"],
    ["novo", "pripravljeno"],
    ["novo", "poslano"],
    ["novo", "preklicano"],
    ["pripravljeno", "zakljuceno"],
    ["pripravljeno", "preklicano"],
    ["poslano", "zakljuceno"],
  ];

  it("dovoli natanko prehode iz načrta", () => {
    const vsi = STATUSI.flatMap((od) => PREHODI[od].map((na) => [od, na]));
    expect(vsi).toEqual(dovoljeni);
    for (const [od, na] of dovoljeni) {
      expect(() => preveriPrehod(od as never, na as never)).not.toThrow();
    }
  });

  it("vsak drug prehod vrže napako", () => {
    for (const od of STATUSI) {
      for (const na of STATUSI) {
        if (od === na || PREHODI[od].includes(na)) continue;
        expect(() => preveriPrehod(od, na), `${od} → ${na}`).toThrow(NapakaPrehoda);
      }
    }
  });

  it("isti status ni prehod (ponovno shranjevanje)", () => {
    for (const s of STATUSI) expect(razlogNedovoljenegaPrehoda(s, s)).toBeNull();
  });

  it("razlog pove, kaj je dovoljeno, končni status je končen", () => {
    expect(razlogNedovoljenegaPrehoda("novo", "zakljuceno")).toBe(
      "Iz statusa „Novo“ ni mogoče preiti v „Zaključeno“. Dovoljeno: „Pripravljeno za prevzem“, „Poslano“, „Preklicano“.",
    );
    expect(razlogNedovoljenegaPrehoda("zakljuceno", "preklicano")).toMatch(/Status je končen\.$/);
    expect(razlogNedovoljenegaPrehoda("poslano", "preklicano")).toMatch(/Dovoljeno: „Zaključeno“/);
  });

  it("„Pripravljeno“ je samo za prevzem, „Poslano“ samo za pošto", () => {
    expect(() => preveriPrehod("novo", "pripravljeno", "prevzem")).not.toThrow();
    expect(() => preveriPrehod("novo", "poslano", "posta")).not.toThrow();
    expect(() => preveriPrehod("novo", "pripravljeno", "posta")).toThrow(/po pošti/);
    expect(() => preveriPrehod("novo", "poslano", "prevzem")).toThrow(/prevzame na kmetiji/);
  });

  it("začetni status: kartica čaka na plačilo, ob prevzemu je novo (Z43)", () => {
    expect(zacetniStatus("kartica")).toBe("caka-placilo");
    expect(zacetniStatus("ob-prevzemu")).toBe("novo");
  });
});
