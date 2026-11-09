import { describe, expect, it } from "vitest";
import { dovoljenaPlacila, dovoljeniNaciniDostave, nastevanje, pravilaDostave } from "./dostava";

describe("pravila dostave in plačila (Z22, T4)", () => {
  it("pošta je dovoljena, ko so vsi izdelki posta-in-prevzem", () => {
    const pravila = pravilaDostave([
      { ime: "Česen v prahu", nacinProdaje: "posta-in-prevzem" },
      { ime: "Bučno olje", nacinProdaje: "posta-in-prevzem" },
    ]);
    expect(pravila).toEqual({ postaDovoljena: true, samoPrevzem: [] });
    expect(dovoljeniNaciniDostave(pravila)).toEqual(["prevzem", "posta"]);
  });

  it("izdelek samo-prevzem onemogoči pošto in pove, kateri je kriv", () => {
    const pravila = pravilaDostave([
      { ime: "Česen v prahu", nacinProdaje: "posta-in-prevzem" },
      { ime: "Jajca kokošja", nacinProdaje: "samo-prevzem" },
      { ime: "Jajca kokošja", nacinProdaje: "samo-prevzem" },
      { ime: "Šparglji", nacinProdaje: "samo-prevzem" },
    ]);
    expect(pravila).toEqual({ postaDovoljena: false, samoPrevzem: ["Jajca kokošja", "Šparglji"] });
    expect(dovoljeniNaciniDostave(pravila)).toEqual(["prevzem"]);
  });

  it("pošta → samo kartica, prevzem → kartica ali ob prevzemu", () => {
    expect(dovoljenaPlacila("posta")).toEqual(["kartica"]);
    expect(dovoljenaPlacila("prevzem")).toEqual(["kartica", "ob-prevzemu"]);
  });

  it("naštevanje v slovenščini", () => {
    expect(nastevanje([])).toBe("");
    expect(nastevanje(["A"])).toBe("A");
    expect(nastevanje(["A", "B"])).toBe("A in B");
    expect(nastevanje(["A", "B", "C"])).toBe("A, B in C");
  });
});
