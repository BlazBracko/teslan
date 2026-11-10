/**
 * Najmanjši dokument Lexical (Payloadovo obogateno besedilo) iz golih
 * odstavkov, za seed in podatkovne migracije.
 */
export interface DokumentLexical {
  [k: string]: unknown;
  root: {
    type: "root";
    format: "";
    indent: number;
    version: number;
    direction: "ltr";
    children: Array<{ type: string; version: number; [k: string]: unknown }>;
  };
}

export function lexicalIzOdstavkov(odstavki: readonly string[]): DokumentLexical {
  return {
    root: {
      type: "root",
      format: "",
      indent: 0,
      version: 1,
      direction: "ltr",
      children: odstavki.map((besedilo) => ({
        type: "paragraph",
        format: "",
        indent: 0,
        version: 1,
        direction: "ltr",
        textFormat: 0,
        textStyle: "",
        children: [{ type: "text", text: besedilo, format: 0, style: "", mode: "normal", detail: 0, version: 1 }],
      })),
    },
  };
}
