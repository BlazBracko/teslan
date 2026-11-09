import { describe, expect, it } from "vitest";
import {
  cenaNaKartici,
  najnizjaNarocljivaCena,
  razpolozljivostIzdelka,
  oznakaNacinaProdaje,
  razpolozljivostVelikosti,
  steviloKosov,
  type IzdelekZaRazpolozljivost,
} from "./razpolozljivost";

const posta: IzdelekZaRazpolozljivost = { nacinProdaje: "posta-in-prevzem", sezona: null };
const sparglji: IzdelekZaRazpolozljivost = {
  nacinProdaje: "samo-prevzem",
  sezona: { od: 4, do: 6 },
};

describe("razpoložljivost velikosti (Z11–Z13)", () => {
  it("na zalogi", () => {
    expect(razpolozljivostVelikosti(posta, { cenaCenti: 500, zaloga: 20 }, 1)).toEqual({
      vrsta: "na-zalogi",
      narocljiva: true,
      oznaka: "Na zalogi",
    });
  });

  it("malo zaloge pove število kosov v pravi slovnični obliki", () => {
    const oznaka = (zaloga: number) =>
      razpolozljivostVelikosti(posta, { cenaCenti: 500, zaloga }, 1).oznaka;
    expect(oznaka(3)).toBe("Še 3 kosi");
    expect(oznaka(2)).toBe("Še 2 kosa");
    expect(oznaka(1)).toBe("Še 1 kos");
    expect(oznaka(4)).toBe("Na zalogi");
    expect(razpolozljivostVelikosti(posta, { cenaCenti: 500, zaloga: 1 }, 1).narocljiva).toBe(true);
  });

  it("brez zaloge ali brez cene ni naročljivo", () => {
    expect(razpolozljivostVelikosti(posta, { cenaCenti: 500, zaloga: 0 }, 1)).toMatchObject({
      vrsta: "ni-na-zalogi",
      narocljiva: false,
      oznaka: "Ni na zalogi",
    });
    expect(razpolozljivostVelikosti(posta, { cenaCenti: null, zaloga: 5 }, 1).narocljiva).toBe(
      false,
    );
  });

  it("sezona: v sezoni naročljivo, mesec prej „Kmalu“, sicer obdobje sezone", () => {
    const velikost = { cenaCenti: 550, zaloga: 20 };
    expect(razpolozljivostVelikosti(sparglji, velikost, 5).narocljiva).toBe(true);
    expect(razpolozljivostVelikosti(sparglji, velikost, 3)).toMatchObject({
      vrsta: "kmalu",
      narocljiva: false,
      oznaka: "Kmalu",
    });
    expect(razpolozljivostVelikosti(sparglji, velikost, 11)).toMatchObject({
      vrsta: "izven-sezone",
      narocljiva: false,
      oznaka: "Sezona April — junij",
    });
  });

  it("samo prikaz ni nikoli naročljiv", () => {
    expect(
      razpolozljivostVelikosti(
        { nacinProdaje: "samo-prikaz", sezona: { od: 5, do: 7 } },
        { cenaCenti: null, zaloga: null },
        6,
      ),
    ).toEqual({ vrsta: "na-kmetiji", narocljiva: false, oznaka: "Na voljo na kmetiji" });
  });

  it("oznaka načina prodaje", () => {
    expect(oznakaNacinaProdaje("samo-prevzem")).toBe("Samo prevzem na kmetiji");
    expect(oznakaNacinaProdaje("posta-in-prevzem")).toBeNull();
  });

  it("najnižja cena upošteva le naročljive velikosti", () => {
    const olje = {
      ...posta,
      velikosti: [
        { cenaCenti: 2000, zaloga: 5 },
        { cenaCenti: 1200, zaloga: 0 },
      ],
    };
    expect(najnizjaNarocljivaCena(olje, 1)).toBe(2000);
    expect(najnizjaNarocljivaCena({ ...olje, velikosti: [olje.velikosti[1]] }, 1)).toBeNull();
  });

  it("število kosov", () => {
    expect([1, 2, 3, 4, 5, 101, 102, 111].map(steviloKosov)).toEqual([
      "1 kos",
      "2 kosa",
      "3 kosi",
      "4 kosi",
      "5 kosov",
      "101 kos",
      "102 kosa",
      "111 kosov",
    ]);
  });
});

describe("razpoložljivost izdelka na kartici (Z13, Z14)", () => {
  const velikosti = (...v: Array<[number | null, number | null]>) =>
    v.map(([cenaCenti, zaloga]) => ({ cenaCenti, zaloga }));

  it("šteje najugodnejša velikost", () => {
    const izdelek = { ...posta, velikosti: velikosti([500, 0], [1200, 2]) };
    expect(razpolozljivostIzdelka(izdelek, 1).oznaka).toBe("Še 2 kosa");
    const vec = { ...posta, velikosti: velikosti([500, 2], [1200, 20]) };
    expect(razpolozljivostIzdelka(vec, 1).oznaka).toBe("Na zalogi");
  });

  it("pri malo zalogi pove največje število kosov", () => {
    const izdelek = { ...posta, velikosti: velikosti([500, 1], [1200, 3]) };
    expect(razpolozljivostIzdelka(izdelek, 1).oznaka).toBe("Še 3 kosi");
  });

  it("izven sezone, kmalu in samo prikaz", () => {
    const s = { ...sparglji, velikosti: velikosti([550, 20]) };
    expect(razpolozljivostIzdelka(s, 11).oznaka).toBe("Sezona April — junij");
    expect(razpolozljivostIzdelka(s, 3).oznaka).toBe("Kmalu");
    const jagode = { nacinProdaje: "samo-prikaz" as const, sezona: null, velikosti: velikosti([null, null]) };
    expect(razpolozljivostIzdelka(jagode, 6)).toMatchObject({ narocljiva: false, oznaka: "Na voljo na kmetiji" });
  });

  it("brez zaloge", () => {
    const izdelek = { ...posta, velikosti: velikosti([500, 0], [1200, 0]) };
    expect(razpolozljivostIzdelka(izdelek, 1)).toMatchObject({ narocljiva: false, oznaka: "Ni na zalogi" });
  });

  it("cena na kartici: najnižja naročljiva, „od“ le pri različnih cenah", () => {
    expect(cenaNaKartici({ ...posta, velikosti: velikosti([500, 20], [1200, 20]) }, 1)).toEqual({
      centi: 500,
      od: true,
    });
    expect(cenaNaKartici({ ...posta, velikosti: velikosti([500, 0], [1200, 20]) }, 1)).toEqual({
      centi: 1200,
      od: false,
    });
    expect(cenaNaKartici({ ...posta, velikosti: velikosti([800, 20]) }, 1)).toEqual({ centi: 800, od: false });
    expect(cenaNaKartici({ ...sparglji, velikosti: velikosti([550, 20]) }, 11)).toBeNull();
  });
});
