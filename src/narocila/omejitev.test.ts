import { describe, expect, it } from "vitest";
import { ipIzGlav, OmejitevNarocil } from "./omejitev";

describe("omejitev naročil na IP (Z26)", () => {
  it("dovoli 5 naročil v 10 minutah, šesto zavrne, nato se okno sprosti", () => {
    const o = new OmejitevNarocil(5, 10 * 60_000);
    const t0 = 1_000_000;
    for (let i = 0; i < 5; i++) {
      expect(o.dovoljeno("1.2.3.4", t0 + i)).toBe(true);
      o.zabelezi("1.2.3.4", t0 + i);
    }
    expect(o.dovoljeno("1.2.3.4", t0 + 60_000)).toBe(false);
    expect(o.dovoljeno("5.6.7.8", t0 + 60_000)).toBe(true);
    expect(o.dovoljeno("1.2.3.4", t0 + 10 * 60_000)).toBe(true);
  });

  it("IP vzame iz zadnjega vnosa X-Forwarded-For ali X-Real-IP", () => {
    const glave = (g: Record<string, string>) => ({ get: (k: string) => g[k] ?? null });
    expect(ipIzGlav(glave({ "x-forwarded-for": "9.9.9.9, 1.2.3.4" }))).toBe("1.2.3.4");
    expect(ipIzGlav(glave({ "x-real-ip": "1.2.3.4" }))).toBe("1.2.3.4");
    expect(ipIzGlav(glave({}))).toBe("neznan");
  });
});
