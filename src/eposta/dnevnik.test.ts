import { describe, expect, it } from "vitest";
import { PRIVZETI_POSILJATELJ, razberiPosiljatelja } from "./dnevnik";

describe("pošiljatelj iz EMAIL_FROM (Z56)", () => {
  it("razbere ime in naslov", () => {
    expect(razberiPosiljatelja("Domačija Tešlan <narocila@teslan.si>")).toEqual({
      ime: "Domačija Tešlan",
      naslov: "narocila@teslan.si",
    });
    expect(razberiPosiljatelja('"Tešlan" <a@b.si>')).toEqual({ ime: "Tešlan", naslov: "a@b.si" });
    expect(razberiPosiljatelja("a@b.si")).toEqual({ ime: "Domačija Tešlan", naslov: "a@b.si" });
    expect(razberiPosiljatelja(undefined)).toEqual(PRIVZETI_POSILJATELJ);
  });
});
