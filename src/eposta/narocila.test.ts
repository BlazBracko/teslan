import { describe, expect, it } from "vitest";
import { kontaktIzNastavitev } from "@/lib/kontakt";
import type { NarociloPogled } from "@/narocila/pogled";
import {
  BESEDILO_VRACILA,
  obvestiloObStatusu,
  obvestiloProdajalcu,
  poslano,
  potrdiloKupcu,
  preklicano,
  pripravljenoZaPrevzem,
} from "./narocila";

const kontakt = kontaktIzNastavitev({
  naslov: "Straža 12, 8351 Straža pri Novem mestu",
  telefon: "040 578 512",
  email: "info@teslan.si",
});
const povezava = "https://trgovina.test/narocilo/T-2026-0007?k=zeton";
const podatki = { povezava, kontakt, navodilaZaPrevzem: "Pokličite nas za termin.\nOb sobotah smo doma." };

const osnova: NarociloPogled = {
  id: 7,
  stevilka: "T-2026-0007",
  status: "novo",
  nacinDostave: "prevzem",
  nacinPlacila: "ob-prevzemu",
  placano: false,
  oddano: "2026-11-10T10:00:00.000Z",
  kupec: { ime: "Ana", priimek: "Novak", email: "ana@primer.si", telefon: "040 123 456" },
  naslov: null,
  darilo: false,
  prejemnik: null,
  opomba: "Prevzem v soboto.",
  stevilkaPosiljke: null,
  razlogPreklica: null,
  postavke: [
    {
      tip: "izdelek",
      ime: "Česen v prahu",
      velikost: "41 ml",
      kolicina: 2,
      cenaCenti: 500,
      stopnjaDDV: 9.5,
      skupajCenti: 1000,
      vsebina: [],
      sporociloNaKartici: null,
    },
    {
      tip: "skatla",
      ime: "Okusi Dolenjske",
      velikost: null,
      kolicina: 1,
      cenaCenti: 2400,
      stopnjaDDV: 22,
      skupajCenti: 2400,
      vsebina: [
        { ime: "Šparglji v prahu", velikost: null, kolicina: 1, cenaCenti: 900 },
        { ime: "Marmelada borovnica", velikost: "212 ml", kolicina: 2, cenaCenti: 600 },
      ],
      sporociloNaKartici: "Vse najboljše, babi!",
    },
  ],
  vmesniSestevekCenti: 3400,
  postninaCenti: 0,
  skupajCenti: 3400,
  ddv: [
    { stopnja: 9.5, osnovaCenti: 2557, ddvCenti: 243 },
    { stopnja: 22, osnovaCenti: 492, ddvCenti: 108 },
  ],
};

const posta: NarociloPogled = {
  ...osnova,
  nacinDostave: "posta",
  nacinPlacila: "kartica",
  placano: true,
  naslov: { ulica: "Prešernova 5", postnaStevilka: "1000", kraj: "Ljubljana" },
  postninaCenti: 500,
  skupajCenti: 3900,
};

/** Besedilo HTML brez oznak, za preverjanje vsebine. */
const brezOznak = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ");

describe("E1 potrdilo kupcu (Z57)", () => {
  const e1 = potrdiloKupcu(osnova, podatki);

  it("ima vse zahtevane podatke v besedilu in HTML", () => {
    expect(e1.zadeva).toBe("Potrdilo naročila T-2026-0007 — Domačija Tešlan");
    for (const vsebina of [e1.besedilo, brezOznak(e1.html)]) {
      expect(vsebina).toContain("T-2026-0007");
      expect(vsebina).toContain("Česen v prahu, 41 ml");
      expect(vsebina).toContain("1 × Šparglji v prahu");
      expect(vsebina).toContain("2 × Marmelada borovnica, 212 ml");
      expect(vsebina).toContain("od tega DDV 9,5 %");
      expect(vsebina).toContain("od tega DDV 22 %");
      expect(vsebina).toContain("Poštnina");
      expect(vsebina).toMatch(/Skupaj\s*:?\s*34,00\s€/);
      expect(vsebina).toContain("Prevzem na kmetiji");
      expect(vsebina).toContain("Ob prevzemu");
      expect(vsebina).toContain("Pokličite nas za termin.");
      expect(vsebina).toContain("Straža 12, 8351 Straža pri Novem mestu");
      expect(vsebina).toContain("To ni račun.");
    }
    expect(e1.besedilo).toContain(`Naročilo si lahko kadar koli ogledate na: ${povezava}`);
    expect(e1.html).toContain(`href="${povezava.replace("&", "&amp;")}"`);
    expect(e1.html).toContain('<html lang="sl">');
  });

  it("sporočila na kartici kupec ne dobi (samo E2)", () => {
    expect(e1.besedilo).not.toContain("Vse najboljše, babi!");
    expect(e1.html).not.toContain("Vse najboljše, babi!");
  });

  it("pri pošti pokaže naslov in plačilo s kartico", () => {
    const e = potrdiloKupcu(posta, podatki);
    expect(e.besedilo).toContain("Naslov za pošiljanje: Prešernova 5, 1000 Ljubljana");
    expect(e.besedilo).toContain("Plačilo: S kartico (plačano)");
    expect(e.besedilo).not.toContain("Pokličite nas za termin.");
  });

  it("ubeži vse, kar je vpisal kupec", () => {
    const e = potrdiloKupcu({ ...osnova, kupec: { ...osnova.kupec, ime: '<script>alert("x")</script>' }, opomba: "a & b" }, podatki);
    expect(e.html).not.toContain("<script>");
    expect(e.html).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
    expect(e.html).toContain("a &amp; b");
  });

  it("navodila za prevzem ohranijo prelome vrstic", () => {
    expect(e1.html).toContain("Pokličite nas za termin.<br>Ob sobotah smo doma.");
  });
});

describe("E2 obvestilo prodajalcu (Z54, Z57)", () => {
  it("ima kupca, sporočilo na kartici in povezavo v admin", () => {
    const e2 = obvestiloProdajalcu(osnova, { povezavaAdmin: "https://trgovina.test/admin/collections/narocila/7" });
    expect(e2.zadeva).toMatch(/^Novo naročilo T-2026-0007: Ana Novak, 34,00\s€$/);
    for (const vsebina of [e2.besedilo, brezOznak(e2.html)]) {
      expect(vsebina).toContain("ana@primer.si");
      expect(vsebina).toContain("040 123 456");
      expect(vsebina).toContain("Prevzem v soboto.");
      expect(vsebina).toContain("Vse najboljše, babi!");
      expect(vsebina).toContain("še ni plačano");
    }
    expect(e2.besedilo).toContain("Sporočilo na kartici: „Vse najboljše, babi!“");
    expect(e2.besedilo).toContain("https://trgovina.test/admin/collections/narocila/7");
  });

  it("darilo je jasno označeno, z naslovom prejemnika", () => {
    const e2 = obvestiloProdajalcu(
      { ...posta, darilo: true, prejemnik: { ime: "Marija Kovač" } },
      { povezavaAdmin: "https://trgovina.test/admin" },
    );
    expect(e2.besedilo).toContain("DARILO – potrdila in cen ne prilagajte paketu.");
    expect(e2.besedilo).toContain("Marija Kovač, Prešernova 5, 1000 Ljubljana");
  });
});

describe("E3–E5 ob spremembi statusa (Z57)", () => {
  it("E3: naslov, pot do kmetije, telefon in znesek za plačilo ob prevzemu", () => {
    const e3 = pripravljenoZaPrevzem(osnova, podatki);
    expect(e3.zadeva).toBe("Naročilo T-2026-0007 je pripravljeno za prevzem — Domačija Tešlan");
    expect(e3.besedilo).toContain("Naslov kmetije: Straža 12, 8351 Straža pri Novem mestu");
    expect(e3.besedilo).toContain("Telefon: 040 578 512");
    expect(e3.besedilo).toContain("https://www.google.com/maps/dir/?api=1&destination=");
    expect(e3.besedilo).toMatch(/Ob prevzemu plačate 34,00\s€\./);
    expect(e3.html).toContain('href="https://www.google.com/maps/dir/?api=1&amp;destination=');
    expect(pripravljenoZaPrevzem({ ...osnova, placano: true }, podatki).besedilo).not.toContain("Ob prevzemu plačate");
  });

  it("E4: številka pošiljke, če je vpisana", () => {
    const brez = poslano(posta, podatki);
    expect(brez.zadeva).toBe("Naročilo T-2026-0007 je poslano — Domačija Tešlan");
    expect(brez.besedilo).toContain("Naslov: Prešernova 5, 1000 Ljubljana");
    expect(brez.besedilo).not.toContain("Številka pošiljke");
    const z = poslano({ ...posta, stevilkaPosiljke: "PS123456789SI" }, podatki);
    expect(z.besedilo).toContain("Številka pošiljke: PS123456789SI");
    expect(brezOznak(z.html)).toContain("PS123456789SI");
  });

  it("E5: pri plačanem s kartico obljubi vračilo, sicer ne; razlog, če je vpisan", () => {
    const kartica = preklicano({ ...posta, razlogPreklica: "Ni več na zalogi." }, podatki);
    expect(kartica.zadeva).toBe("Naročilo T-2026-0007 je preklicano — Domačija Tešlan");
    expect(kartica.besedilo).toContain(BESEDILO_VRACILA);
    expect(kartica.besedilo).toContain("Razlog: Ni več na zalogi.");
    expect(brezOznak(kartica.html)).toContain(BESEDILO_VRACILA);
    expect(preklicano(osnova, podatki).besedilo).not.toContain(BESEDILO_VRACILA);
    expect(preklicano({ ...posta, placano: false }, podatki).besedilo).not.toContain(BESEDILO_VRACILA);
  });

  it("izbere obvestilo po prehodu; preklic neplačanega naročila ne pošlje ničesar (Z41)", () => {
    const oznaka = (od: Parameters<typeof obvestiloObStatusu>[0], na: Parameters<typeof obvestiloObStatusu>[1]) =>
      obvestiloObStatusu(od, na, osnova, podatki)?.oznaka ?? null;
    expect(oznaka("novo", "pripravljeno")).toBe("E3 pripravljeno za prevzem");
    expect(oznaka("novo", "poslano")).toBe("E4 poslano");
    expect(oznaka("novo", "preklicano")).toBe("E5 preklicano");
    expect(oznaka("pripravljeno", "preklicano")).toBe("E5 preklicano");
    expect(oznaka("caka-placilo", "preklicano")).toBeNull();
    expect(oznaka("caka-placilo", "novo")).toBeNull();
    expect(oznaka("pripravljeno", "zakljuceno")).toBeNull();
    expect(oznaka("preklicano", "preklicano")).toBeNull();
  });
});
