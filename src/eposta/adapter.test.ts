import type { EmailAdapter, Payload, SendEmailOptions } from "payload";
import { afterEach, describe, expect, it, vi } from "vitest";
import { adapterEposte, nacinPosiljanja, opozorilaEposte, preusmeri, sPreusmeritvijo, zadevaPreusmeritve } from "./adapter";

const logger = { info: vi.fn(), error: vi.fn() };
const zazeni = (adapter: EmailAdapter) => adapter({ payload: { logger } as unknown as Payload });

const sporocilo: SendEmailOptions = {
  to: "ana@primer.si",
  replyTo: "sandi@primer.si",
  subject: "Potrdilo naročila T-2026-0001",
  text: "Besedilo",
  html: "<p>Besedilo</p>",
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("izbira poti (Z58)", () => {
  it("brez RESEND_API_KEY gre e-pošta v log, s ključem prek Resenda", () => {
    expect(nacinPosiljanja({})).toBe("dnevnik");
    expect(nacinPosiljanja({ RESEND_API_KEY: "re_123" })).toBe("resend");
    expect(zazeni(adapterEposte({})).name).toBe("dnevnik");
    expect(zazeni(adapterEposte({ RESEND_API_KEY: "re_123" })).name).toBe("resend-rest");
  });

  it("pošiljatelj je EMAIL_FROM (Z56)", () => {
    const a = zazeni(adapterEposte({ RESEND_API_KEY: "re_123", EMAIL_FROM: "Tešlan test <test@teslan.si>" }));
    expect([a.defaultFromName, a.defaultFromAddress]).toEqual(["Tešlan test", "test@teslan.si"]);
    const privzeto = zazeni(adapterEposte({}));
    expect([privzeto.defaultFromName, privzeto.defaultFromAddress]).toEqual(["Domačija Tešlan", "narocila@teslan.si"]);
  });

  it("brez ključa se besedilo izpiše v log", async () => {
    const zapis = await zazeni(adapterEposte({})).sendEmail(sporocilo);
    expect(zapis).toMatchObject({ za: "ana@primer.si", odgovorNa: "sandi@primer.si", html: "<p>Besedilo</p>" });
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining("RESEND_API_KEY ni nastavljen"));
  });
});

describe("preusmeritev na stagingu (Z58)", () => {
  it("vse gre na EMAIL_REDIRECT_TO, zadeva pove prvotne prejemnike, kopije odpadejo", () => {
    const p = preusmeri({ ...sporocilo, cc: ["b@primer.si"], bcc: { name: "C", address: "c@primer.si" } }, "lastnik@primer.si");
    expect(p).toMatchObject({
      to: "lastnik@primer.si",
      cc: undefined,
      bcc: undefined,
      replyTo: "sandi@primer.si",
      subject: "[STAGING → ana@primer.si, b@primer.si, c@primer.si] Potrdilo naročila T-2026-0001",
      html: "<p>Besedilo</p>",
    });
    expect(zadevaPreusmeritve("Z", [])).toBe("[STAGING → brez prejemnika] Z");
  });

  it("ovije katerikoli adapter (dnevnik in Resend)", async () => {
    const posiljanje = vi.fn(async (s: SendEmailOptions) => s);
    const notranji: EmailAdapter = () => ({ name: "x", defaultFromAddress: "a@b.si", defaultFromName: "A", sendEmail: posiljanje });
    await zazeni(sPreusmeritvijo(notranji, "lastnik@primer.si")).sendEmail(sporocilo);
    expect(posiljanje).toHaveBeenCalledWith(expect.objectContaining({ to: "lastnik@primer.si" }));

    const zapis = await zazeni(adapterEposte({ EMAIL_REDIRECT_TO: "lastnik@primer.si" })).sendEmail(sporocilo);
    expect(zapis).toMatchObject({ za: "lastnik@primer.si", zadeva: expect.stringMatching(/^\[STAGING → ana@primer\.si\]/) });
  });
});

describe("opozorila ob zagonu", () => {
  it("opozori na manjkajoč ključ, staging brez preusmeritve in preusmeritev v produkciji", () => {
    expect(opozorilaEposte({ NODE_ENV: "development" })).toEqual([]);
    expect(opozorilaEposte({ NODE_ENV: "production" })).toEqual([expect.stringContaining("RESEND_API_KEY ni nastavljen")]);
    expect(
      opozorilaEposte({ NODE_ENV: "production", RESEND_API_KEY: "re_1", NOINDEX: "1", EMAIL_REDIRECT_TO: "a@b.si" }),
    ).toEqual([]);
    expect(opozorilaEposte({ NODE_ENV: "production", RESEND_API_KEY: "re_1", NOINDEX: "1" })).toEqual([
      expect.stringContaining("brez EMAIL_REDIRECT_TO"),
    ]);
    expect(opozorilaEposte({ NODE_ENV: "production", RESEND_API_KEY: "re_1", EMAIL_REDIRECT_TO: "a@b.si" })).toEqual([
      expect.stringContaining("brez NOINDEX=1"),
    ]);
    expect(opozorilaEposte({ NODE_ENV: "production", RESEND_API_KEY: "re_1" })).toEqual([]);
  });
});

describe("Resend (Z56, Z59)", () => {
  it("pošlje HTML, besedilo, pošiljatelja in naslov za odgovor prek REST API", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: "e-1" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const a = zazeni(adapterEposte({ RESEND_API_KEY: "re_test_kljuc", EMAIL_FROM: "Domačija Tešlan <narocila@teslan.si>" }));
    await expect(a.sendEmail(sporocilo)).resolves.toEqual({ id: "e-1" });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer re_test_kljuc");
    expect(JSON.parse(String(init.body))).toMatchObject({
      from: "Domačija Tešlan <narocila@teslan.si>",
      to: "ana@primer.si",
      reply_to: "sandi@primer.si",
      subject: "Potrdilo naročila T-2026-0001",
      text: "Besedilo",
      html: "<p>Besedilo</p>",
    });
  });

  it("napako Resenda vrže, da jo klicatelj zapiše na naročilo", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ statusCode: 403, name: "validation_error", message: "Domena ni overjena." }), {
          status: 403,
        }),
      ),
    );
    await expect(zazeni(adapterEposte({ RESEND_API_KEY: "re_test_kljuc" })).sendEmail(sporocilo)).rejects.toThrow(
      /403 validation_error - Domena ni overjena/,
    );
  });
});

// S pravim ključem pošlje eno sporočilo na Resendov testni naslov. Brez
// ključa je preskočeno (načrt §11, predaja); pošiljatelj mora biti na
// overjeni domeni (EMAIL_FROM ali privzeto narocila@teslan.si).
const pravKljuc = process.env.RESEND_API_KEY;
describe.skipIf(!pravKljuc)("Resend s pravim ključem (preskočeno, ker RESEND_API_KEY ni nastavljen)", () => {
  it("pošlje sporočilo na delivered@resend.dev", async () => {
    const a = zazeni(adapterEposte({ RESEND_API_KEY: pravKljuc, EMAIL_FROM: process.env.EMAIL_FROM }));
    const odgovor = (await a.sendEmail({ ...sporocilo, to: "delivered@resend.dev", replyTo: undefined })) as { id?: string };
    expect(odgovor.id).toBeTruthy();
  });
});
