import { oznakaStopnje } from "@/kosarica/cene";
import { formatirajCeno } from "@/lib/denar";
import { IME_KMETIJE, type Kontakt } from "@/lib/kontakt";
import { OZNAKE_DOSTAVE, OZNAKE_PLACILA, type NarociloPogled } from "@/narocila/pogled";

/**
 * Besedilo obvestil ob novem naročilu (Z57): E1 potrdilo kupcu in E2
 * obvestilo prodajalcu. K7 pošlje besedilno različico; K9 doda HTML,
 * E3–E5 in pošiljanje prek Resenda.
 */

export interface Sporocilo {
  zadeva: string;
  besedilo: string;
}

function postavke(n: NarociloPogled): string[] {
  const vrstice = n.postavke.map(
    (p) =>
      `- ${p.ime}${p.velikost ? `, ${p.velikost}` : ""} × ${p.kolicina} … ${formatirajCeno(p.skupajCenti)}`,
  );
  vrstice.push(
    "",
    `Vmesni seštevek: ${formatirajCeno(n.vmesniSestevekCenti)}`,
    `Poštnina: ${formatirajCeno(n.postninaCenti)}`,
    `Skupaj: ${formatirajCeno(n.skupajCenti)}`,
    ...n.ddv.map((d) => `  od tega DDV ${oznakaStopnje(d.stopnja)}: ${formatirajCeno(d.ddvCenti)}`),
  );
  return vrstice;
}

function dostava(n: NarociloPogled): string[] {
  return n.naslov
    ? [`Dostava: ${OZNAKE_DOSTAVE.posta}`, `${n.naslov.ulica}, ${n.naslov.postnaStevilka} ${n.naslov.kraj}`]
    : [`Dostava: ${OZNAKE_DOSTAVE.prevzem}`];
}

export function potrdiloKupcu(
  n: NarociloPogled,
  { povezava, navodilaZaPrevzem, kontakt }: { povezava: string; navodilaZaPrevzem: string | null; kontakt: Kontakt },
): Sporocilo {
  const prevzem = n.nacinDostave === "prevzem";
  const besedilo = [
    `Pozdravljeni, ${n.kupec.ime}!`,
    "",
    `Hvala za vaše naročilo ${n.stevilka}. Prejeli smo ga in ga pripravljamo.`,
    "",
    "Naročili ste:",
    ...postavke(n),
    "",
    ...dostava(n),
    `Plačilo: ${OZNAKE_PLACILA[n.nacinPlacila]}${n.placano ? " (plačano)" : ""}`,
    ...(n.opomba ? [`Vaša opomba: ${n.opomba}`] : []),
    "",
    ...(prevzem
      ? [
          navodilaZaPrevzem?.trim() ||
            "Ko bo naročilo pripravljeno, vas obvestimo in se dogovorimo za termin prevzema.",
          ...(kontakt.naslov ? [`Naslov kmetije: ${kontakt.naslov}`] : []),
          "",
        ]
      : []),
    `Naročilo si lahko kadar koli ogledate na: ${povezava}`,
    "",
    "To ni račun.",
    "",
    "Lep pozdrav,",
    IME_KMETIJE,
    ...(kontakt.telefon ? [`Telefon: ${kontakt.telefon}`] : []),
  ].join("\n");
  return { zadeva: `Potrdilo naročila ${n.stevilka} — ${IME_KMETIJE}`, besedilo };
}

export function obvestiloProdajalcu(n: NarociloPogled, { povezavaAdmin }: { povezavaAdmin: string }): Sporocilo {
  const besedilo = [
    `Novo naročilo ${n.stevilka} na spletni strani.`,
    "",
    `Kupec: ${n.kupec.ime} ${n.kupec.priimek}`,
    `E-pošta: ${n.kupec.email}`,
    `Telefon: ${n.kupec.telefon}`,
    "",
    ...dostava(n),
    `Plačilo: ${OZNAKE_PLACILA[n.nacinPlacila]}${n.placano ? " (plačano)" : " (še ni plačano)"}`,
    ...(n.opomba ? [`Opomba kupca: ${n.opomba}`] : []),
    "",
    "Postavke:",
    ...postavke(n),
    "",
    `Odpri v adminu: ${povezavaAdmin}`,
  ].join("\n");
  return {
    zadeva: `Novo naročilo ${n.stevilka}: ${n.kupec.ime} ${n.kupec.priimek}, ${formatirajCeno(n.skupajCenti)}`,
    besedilo,
  };
}
