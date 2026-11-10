import { describe, expect, it } from "vitest";
import { izpostavljenaVprasanja, pogostaVprasanja, vprasanjaJsonLd } from "./vprasanja";

const podatki = {
  postninaCenti: 500,
  pragBrezplacnePostnineCenti: 5000,
  telefon: "040 578 512",
  email: "kmetija@example.com",
  naslov: "Podgora 15, 8351 Straža pri Novem mestu",
};

describe("pogosta vprašanja", () => {
  const sklopi = pogostaVprasanja(podatki);
  const vsa = sklopi.flatMap((s) => s.vprasanja);

  it("zneske in kontakt vzame iz nastavitev trgovine", () => {
    const postnina = vsa.find((v) => v.id === "postnina");
    expect(postnina?.odgovor.join(" ")).toMatch(/5,00\s€.*50,00\s€/);
    expect(vsa.find((v) => v.id === "narocilo-po-telefonu")?.odgovor[0]).toContain("040 578 512");
    expect(vsa.find((v) => v.id === "prevzem")?.odgovor.join(" ")).toContain("Podgora 15");
  });

  it("brez telefona in e-pošte ne pusti praznih mest v besedilu", () => {
    const brez = pogostaVprasanja({ ...podatki, telefon: null, email: null, naslov: null }).flatMap((s) => s.vprasanja);
    for (const v of brez) {
      expect(v.odgovor.join(" ")).not.toMatch(/null|undefined| {2}| \.|: \./);
    }
  });

  it("ima enolične id-je (sidra) in nikjer ne trdi, da je kmetija ekološka", () => {
    const idji = [...sklopi.map((s) => s.id), ...vsa.map((v) => v.id)];
    expect(new Set(idji).size).toBe(idji.length);
    expect(JSON.stringify(sklopi)).not.toMatch(/ekološk|\bbio\b|brez pesticidov/i);
  });

  it("izbor za domačo stran in JSON-LD", () => {
    expect(izpostavljenaVprasanja(sklopi).length).toBeGreaterThanOrEqual(3);
    const ld = vprasanjaJsonLd(sklopi);
    expect(ld.mainEntity).toHaveLength(vsa.length);
    expect(ld.mainEntity[0]).toMatchObject({ "@type": "Question", acceptedAnswer: { "@type": "Answer" } });
  });
});
