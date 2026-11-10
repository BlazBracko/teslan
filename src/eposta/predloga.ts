/**
 * Ogrodje e-poštnih sporočil (Z57): sporočilo je seznam blokov, iz katerih
 * se izrišeta besedilna in HTML različica. Tako obe vedno povesta isto.
 *
 * HTML je tabelaričen z vgrajenimi slogi (e-poštni odjemalci ne podpirajo
 * zunanjih slogov ne spremenljivk), barve so iz palete strani
 * (`src/app/(frontend)/globals.css`). Vse vrednosti se ubežijo.
 */

export type Blok =
  | { vrsta: "odstavek"; besedilo: string }
  | { vrsta: "naslov"; besedilo: string }
  | { vrsta: "podatki"; vrstice: ReadonlyArray<readonly [oznaka: string, vrednost: string]> }
  | { vrsta: "postavke"; postavke: readonly VrsticaPostavke[]; povzetek: readonly VrsticaPovzetka[] }
  | { vrsta: "gumb"; oznaka: string; url: string; uvod?: string }
  | { vrsta: "poudarek"; besedilo: string; ton?: "info" | "opozorilo" };

export interface VrsticaPostavke {
  /** „Česen v prahu, 41 ml“ */
  ime: string;
  kolicina: number;
  /** Skupaj za postavko, že oblikovano. */
  znesek: string;
  /** Vsebina darilne škatle, npr. „1 × Šparglji v prahu“. */
  podrobnosti: readonly string[];
  /** Sporočilo na kartici (samo E2). */
  sporocilo?: string | null;
}

export interface VrsticaPovzetka {
  oznaka: string;
  znesek: string;
  /** „od tega DDV …“: zamaknjeno, manjše. */
  podrejeno?: boolean;
  poudarjeno?: boolean;
}

export interface Sporocilo {
  zadeva: string;
  besedilo: string;
  html: string;
}

export interface VhodSporocila {
  zadeva: string;
  /** Kratko besedilo, ki ga odjemalec pokaže ob zadevi. */
  predogled: string;
  /** Naslov na vrhu sporočila. */
  naslov: string;
  bloki: readonly Blok[];
  /** Podpis in kontakt pod sporočilom. */
  noga: readonly string[];
}

const BARVE = {
  podlaga: "#f6f3ec",
  povrsina: "#fffdf8",
  crta: "#e2dacb",
  besedilo: "#1d211c",
  zamolklo: "#4f564d",
  znamka: "#2f4d35",
  naZnamki: "#fbf9f3",
  znamkaMehko: "#e2eadd",
  opozorilo: "#7e4f00",
  opozoriloMehko: "#fbeed2",
} as const;

const PISAVA = "Inter, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const PISAVA_NASLOVA = "Fraunces, Georgia, 'Times New Roman', serif";

/* ---------- besedilna različica ---------- */

function besediloBloka(b: Blok): string {
  switch (b.vrsta) {
    case "odstavek":
      return b.besedilo;
    case "naslov":
      return b.besedilo;
    case "podatki":
      return b.vrstice.map(([o, v]) => `${o}: ${v.replace(/\n/g, ", ")}`).join("\n");
    case "postavke":
      return [
        ...b.postavke.flatMap((p) => [
          `- ${p.ime} × ${p.kolicina} … ${p.znesek}`,
          ...p.podrobnosti.map((d) => `    ${d}`),
          ...(p.sporocilo ? [`    Sporočilo na kartici: „${p.sporocilo}“`] : []),
        ]),
        "",
        ...b.povzetek.map((v) => `${v.podrejeno ? "  " : ""}${v.oznaka}: ${v.znesek}`),
      ].join("\n");
    case "gumb":
      return `${b.uvod ?? b.oznaka}: ${b.url}`;
    case "poudarek":
      return b.besedilo;
  }
}

export function izrisiBesedilo(v: Pick<VhodSporocila, "bloki" | "noga">): string {
  return [...v.bloki.map(besediloBloka), v.noga.join("\n")].join("\n\n");
}

/* ---------- HTML različica ---------- */

export function ubezi(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Ubeži in ohrani prelome vrstic (npr. navodila za prevzem iz nastavitev). */
const zVrsticami = (s: string) => ubezi(s).replace(/\r?\n/g, "<br>");

/** Samo http(s) povezave; ostalo (npr. `javascript:`) postane `#`. */
function varenUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? ubezi(url) : "#";
}

const odstavek = (vsebina: string, slog = "") =>
  `<p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:${BARVE.besedilo};${slog}">${vsebina}</p>`;

function htmlBloka(b: Blok): string {
  switch (b.vrsta) {
    case "odstavek":
      return odstavek(zVrsticami(b.besedilo));
    case "naslov":
      return `<h2 style="margin:24px 0 8px;font-family:${PISAVA_NASLOVA};font-size:19px;line-height:1.3;font-weight:600;color:${BARVE.besedilo};">${ubezi(b.besedilo)}</h2>`;
    case "podatki":
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 16px;">${b.vrstice
        .map(
          ([o, v]) =>
            `<tr><td style="padding:6px 12px 6px 0;vertical-align:top;width:38%;font-size:14px;line-height:1.45;color:${BARVE.zamolklo};">${ubezi(o)}</td><td style="padding:6px 0;vertical-align:top;font-size:15px;line-height:1.45;color:${BARVE.besedilo};">${zVrsticami(v)}</td></tr>`,
        )
        .join("")}</table>`;
    case "postavke": {
      const vrstice = b.postavke
        .map((p) => {
          const dodatno = [
            ...p.podrobnosti.map(
              (d) => `<div style="font-size:13px;line-height:1.45;color:${BARVE.zamolklo};">${ubezi(d)}</div>`,
            ),
            ...(p.sporocilo
              ? [
                  `<div style="margin-top:4px;font-size:13px;line-height:1.45;color:${BARVE.besedilo};"><strong>Sporočilo na kartici:</strong> „${zVrsticami(p.sporocilo)}“</div>`,
                ]
              : []),
          ].join("");
          return `<tr><td style="padding:10px 12px 10px 0;border-bottom:1px solid ${BARVE.crta};vertical-align:top;font-size:15px;line-height:1.45;color:${BARVE.besedilo};">${ubezi(p.ime)}${dodatno}</td><td style="padding:10px 12px 10px 0;border-bottom:1px solid ${BARVE.crta};vertical-align:top;white-space:nowrap;font-size:15px;color:${BARVE.zamolklo};">× ${p.kolicina}</td><td align="right" style="padding:10px 0;border-bottom:1px solid ${BARVE.crta};vertical-align:top;white-space:nowrap;font-size:15px;color:${BARVE.besedilo};">${ubezi(p.znesek)}</td></tr>`;
        })
        .join("");
      const povzetek = b.povzetek
        .map((v) => {
          const velikost = v.podrejeno ? "13px" : v.poudarjeno ? "17px" : "15px";
          const barva = v.podrejeno ? BARVE.zamolklo : BARVE.besedilo;
          const debelina = v.poudarjeno ? "700" : "400";
          const zamik = v.podrejeno ? "padding-left:12px;" : "";
          return `<tr><td colspan="2" style="padding:4px 12px 4px 0;${zamik}font-size:${velikost};font-weight:${debelina};color:${barva};">${ubezi(v.oznaka)}</td><td align="right" style="padding:4px 0;white-space:nowrap;font-size:${velikost};font-weight:${debelina};color:${barva};">${ubezi(v.znesek)}</td></tr>`;
        })
        .join("");
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 20px;">${vrstice}<tr><td colspan="3" style="height:8px;line-height:8px;font-size:0;">&nbsp;</td></tr>${povzetek}</table>`;
    }
    case "gumb":
      return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;"><tr><td style="border-radius:999px;background:${BARVE.znamka};"><a href="${varenUrl(b.url)}" style="display:inline-block;padding:12px 24px;font-size:15px;font-weight:600;color:${BARVE.naZnamki};text-decoration:none;border-radius:999px;">${ubezi(b.oznaka)}</a></td></tr></table>${odstavek(
        `Če gumb ne deluje, odprite: <a href="${varenUrl(b.url)}" style="color:${BARVE.znamka};word-break:break-all;">${ubezi(b.url)}</a>`,
        `font-size:13px;color:${BARVE.zamolklo};`,
      )}`;
    case "poudarek": {
      const opozorilo = b.ton === "opozorilo";
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;"><tr><td style="padding:12px 16px;border-radius:12px;background:${opozorilo ? BARVE.opozoriloMehko : BARVE.znamkaMehko};font-size:15px;line-height:1.5;font-weight:600;color:${opozorilo ? BARVE.opozorilo : BARVE.znamka};">${zVrsticami(b.besedilo)}</td></tr></table>`;
    }
  }
}

export function izrisiHtml(v: VhodSporocila): string {
  return `<!doctype html>
<html lang="sl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${ubezi(v.zadeva)}</title>
</head>
<body style="margin:0;padding:0;background:${BARVE.podlaga};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${ubezi(v.predogled)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BARVE.podlaga};">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;font-family:${PISAVA};">
<tr><td style="padding:0 8px 16px;font-family:${PISAVA_NASLOVA};font-size:20px;font-weight:600;color:${BARVE.znamka};">Domačija Tešlan</td></tr>
<tr><td style="padding:28px 24px;background:${BARVE.povrsina};border:1px solid ${BARVE.crta};border-radius:16px;">
<h1 style="margin:0 0 16px;font-family:${PISAVA_NASLOVA};font-size:24px;line-height:1.25;font-weight:600;color:${BARVE.besedilo};">${ubezi(v.naslov)}</h1>
${v.bloki.map(htmlBloka).join("\n")}
<p style="margin:24px 0 0;font-size:14px;line-height:1.55;color:${BARVE.zamolklo};">${v.noga.map(ubezi).join("<br>")}</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export function sestaviSporocilo(v: VhodSporocila): Sporocilo {
  return { zadeva: v.zadeva, besedilo: izrisiBesedilo(v), html: izrisiHtml(v) };
}
