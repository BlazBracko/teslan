import { describe, expect, it } from "vitest";
import type { NacinProdaje } from "./razpolozljivost";
import { izborZaDomov, razvrstiZaSeznam } from "./razvrscanje";
import type { Sezona } from "./sezona";

const izdelek = (
  ime: string,
  o: { nacin?: NacinProdaje; sezona?: Sezona | null; zaloga?: number; kategorija?: number; izpostavljen?: boolean } = {},
) => ({
  ime,
  nacinProdaje: o.nacin ?? ("posta-in-prevzem" as NacinProdaje),
  sezona: o.sezona ?? null,
  izpostavljen: o.izpostavljen ?? false,
  kategorija: { id: o.kategorija ?? 1 },
  velikosti: [{ cenaCenti: 500, zaloga: o.zaloga ?? 10 }],
});

describe("razvrstiZaSeznam", () => {
  it("naročljive izdelke postavi pred nenaročljive in ohrani vrstni red iz CMS", () => {
    const seznam = [
      izdelek("Šparglji", { nacin: "samo-prevzem", sezona: { od: 4, do: 6 } }),
      izdelek("Razprodano", { zaloga: 0 }),
      izdelek("Jagode", { nacin: "samo-prikaz" }),
      izdelek("Česen v prahu"),
      izdelek("Decembrski", { sezona: { od: 12, do: 1 } }),
      izdelek("Jajca", { nacin: "samo-prevzem", zaloga: 2 }),
    ];
    expect(razvrstiZaSeznam(seznam, 11).map((i) => i.ime)).toEqual([
      "Česen v prahu",
      "Jajca",
      "Decembrski",
      "Jagode",
      "Šparglji",
      "Razprodano",
    ]);
  });

  it("v sezoni so sezonski izdelki na svojem mestu", () => {
    const seznam = [izdelek("Šparglji", { nacin: "samo-prevzem", sezona: { od: 4, do: 6 } }), izdelek("Česen v prahu")];
    expect(razvrstiZaSeznam(seznam, 5).map((i) => i.ime)).toEqual(["Šparglji", "Česen v prahu"]);
  });
});

describe("izborZaDomov", () => {
  const seznam = [
    izdelek("Šparglji", { nacin: "samo-prevzem", sezona: { od: 4, do: 6 }, izpostavljen: true, kategorija: 1 }),
    izdelek("Česen v prahu", { kategorija: 2 }),
    izdelek("Čebula v prahu", { kategorija: 2 }),
    izdelek("Bučno olje", { kategorija: 3, izpostavljen: true }),
    izdelek("Jagode", { nacin: "samo-prikaz", kategorija: 4, izpostavljen: true }),
    izdelek("Marmelada", { kategorija: 5 }),
  ];

  it("ne vzame izdelkov, ki so na voljo na kmetiji, tudi ko so naročljivi", () => {
    const jajca = izdelek("Jajca", { nacin: "samo-prevzem", izpostavljen: true, kategorija: 6 });
    expect(izborZaDomov([jajca, ...seznam], 5, 10).map((i) => i.ime)).not.toContain("Jajca");
  });

  it("vzame izpostavljene naročljive, nato po enega iz vsake kategorije", () => {
    expect(izborZaDomov(seznam, 11, 3).map((i) => i.ime)).toEqual(["Bučno olje", "Česen v prahu", "Marmelada"]);
  });

  it("dopolni z ostalimi, če kategorij zmanjka, in nikoli ne vrne nenaročljivih", () => {
    expect(izborZaDomov(seznam, 11, 10).map((i) => i.ime)).toEqual([
      "Bučno olje",
      "Česen v prahu",
      "Marmelada",
      "Čebula v prahu",
    ]);
  });
});
