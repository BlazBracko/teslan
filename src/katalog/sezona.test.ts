import { describe, expect, it } from "vitest";
import {
  jeKmalu,
  oznakaSezone,
  sezonaIzPolj,
  stanjeSezone,
  trenutniMesec,
  vSezoni,
  type Mesec,
} from "./sezona";

describe("sezona (Z12, S4)", () => {
  const cezNovoLeto = { od: 11, do: 2 } as const;
  const poletje = { od: 5, do: 7 } as const;

  it("sezona {11, 2} je v januarju v sezoni, v marcu ne", () => {
    expect(vSezoni(cezNovoLeto, 1)).toBe(true);
    expect(vSezoni(cezNovoLeto, 11)).toBe(true);
    expect(vSezoni(cezNovoLeto, 12)).toBe(true);
    expect(vSezoni(cezNovoLeto, 2)).toBe(true);
    expect(vSezoni(cezNovoLeto, 3)).toBe(false);
    expect(vSezoni(cezNovoLeto, 10)).toBe(false);
  });

  it("navadna sezona vključuje oba robna meseca", () => {
    const meseci = Array.from({ length: 12 }, (_, i) => (i + 1) as Mesec);
    expect(meseci.filter((m) => vSezoni(poletje, m))).toEqual([5, 6, 7]);
  });

  it("mesec pred začetkom vrne „Kmalu“, tudi čez novo leto", () => {
    expect(jeKmalu(poletje, 4)).toBe(true);
    expect(stanjeSezone(poletje, 4)).toBe("kmalu");
    expect(stanjeSezone(cezNovoLeto, 10)).toBe("kmalu");
    expect(stanjeSezone({ od: 1, do: 3 }, 12)).toBe("kmalu");
    expect(stanjeSezone(poletje, 3)).toBe("izven-sezone");
    expect(stanjeSezone(poletje, 8)).toBe("izven-sezone");
  });

  it("enomesečna sezona in sezona čez vse leto", () => {
    expect(stanjeSezone({ od: 6, do: 6 }, 6)).toBe("v-sezoni");
    expect(stanjeSezone({ od: 6, do: 6 }, 5)).toBe("kmalu");
    // od 1 do 12: vedno v sezoni, nikoli „kmalu“
    for (let m = 1; m <= 12; m++) {
      expect(stanjeSezone({ od: 1, do: 12 }, m as Mesec)).toBe("v-sezoni");
    }
  });

  it("brez sezone je izdelek vse leto na voljo", () => {
    expect(stanjeSezone(null, 3)).toBe("v-sezoni");
  });

  it("oznaka sezone", () => {
    expect(oznakaSezone({ od: 4, do: 6 })).toBe("April — junij");
  });

  it("trenutni mesec se računa v Ljubljani, ne v UTC", () => {
    // 31. 12. 2026 ob 23.30 UTC je v Ljubljani že januar.
    expect(trenutniMesec(new Date("2026-12-31T23:30:00Z"))).toBe(1);
    // 30. 6. ob 22.30 UTC je v Ljubljani (poletni čas, UTC+2) že julij.
    expect(trenutniMesec(new Date("2026-06-30T22:30:00Z"))).toBe(7);
    expect(trenutniMesec(new Date("2026-06-30T21:30:00Z"))).toBe(6);
  });

  it("sezona iz polj Payloada", () => {
    expect(sezonaIzPolj({ od: "11", do: "2" })).toEqual({ od: 11, do: 2 });
    expect(sezonaIzPolj({ od: "4", do: null })).toBeNull();
    expect(sezonaIzPolj({})).toBeNull();
    expect(sezonaIzPolj(null)).toBeNull();
    expect(sezonaIzPolj({ od: "13", do: "2" })).toBeNull();
  });
});
