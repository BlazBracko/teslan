/**
 * Omejitev števila naročil na IP (Z26): največ `najvec` naročil v oknu
 * `oknoMs`. Hrani se v pomnilniku procesa (ena instanca na Railwayu), zato
 * se ob ponovnem zagonu ponastavi.
 */
export class OmejitevNarocil {
  private readonly casi = new Map<string, number[]>();

  constructor(
    private readonly najvec: number,
    private readonly oknoMs: number,
  ) {}

  private sveži(kljuc: string, zdaj: number): number[] {
    const casi = (this.casi.get(kljuc) ?? []).filter((t) => zdaj - t < this.oknoMs);
    if (casi.length === 0) this.casi.delete(kljuc);
    else this.casi.set(kljuc, casi);
    return casi;
  }

  /** Ali sme ta IP oddati še eno naročilo. */
  dovoljeno(kljuc: string, zdaj = Date.now()): boolean {
    return this.sveži(kljuc, zdaj).length < this.najvec;
  }

  /** Zabeleži oddano naročilo. */
  zabelezi(kljuc: string, zdaj = Date.now()): void {
    this.casi.set(kljuc, [...this.sveži(kljuc, zdaj), zdaj]);
    // Varovalka pred rastjo pomnilnika: občasno počisti stare vnose.
    if (this.casi.size > 10_000) {
      for (const k of [...this.casi.keys()]) this.sveži(k, zdaj);
    }
  }
}

export const NAROCIL_NA_IP = 5;
export const OKNO_OMEJITVE_MS = 10 * 60 * 1000;

/**
 * IP obiskovalca iz glav posrednika. Railway doda pravi IP kot zadnji
 * vnos v `X-Forwarded-For`; prejšnje vnose lahko pošlje odjemalec sam,
 * zato se upošteva zadnji.
 */
export function ipIzGlav(glave: { get(ime: string): string | null }): string {
  const xff = glave.get("x-forwarded-for");
  const zadnji = xff
    ?.split(",")
    .map((d) => d.trim())
    .filter(Boolean)
    .at(-1);
  return zadnji || glave.get("x-real-ip")?.trim() || "neznan";
}
