import { existsSync } from "node:fs";
import path from "node:path";
import type { Darila } from "@/darila/pogled";
import type { Env } from "@/env";
import { nastavitveR2 } from "@/payload/shramba";
import { SLIKE } from "@/seed/podatki";
import type { Katalog, SlikaPogled } from "./pogled";

/**
 * Testne slike za staging brez R2.
 *
 * Brez R2 Payload hrani slike na disku vsebnika (`media/`), ki ga Railway ob
 * vsakem deployu izbriše; zapisi v bazi ostanejo, datoteke pa ne, zato bi
 * okvirji ostali prazni. Ko so testne slike vklopljene, se:
 *  - slika, katere datoteke ni na disku, zamenja z isto datoteko iz `public/`
 *    (seed jih nalaga od tam) ali s testno sliko,
 *  - izdelek, skupina, škatla ali program brez slike dobi testno sliko.
 *
 * Privzeto so vklopljene samo na produkcijski gradnji brez R2 (staging danes).
 * Z R2 se ta modul ne izvede in prikaz je enak kot brez njega. Z
 * `TESTNE_SLIKE=0` se izklopijo (e2e preverja nadomestno ploskev, Z15), z
 * `TESTNE_SLIKE=1` se vklopijo tudi pri razvoju.
 */

const POT_DATOTEK = "/api/media/file/";

/** Zaloga testnih slik: fotografije kmetije iz `public/`, ki jih uporablja seed. */
export const TESTNE_SLIKE: readonly SlikaPogled[] = Object.values(SLIKE).map((s) => ({
  url: `/${s.datoteka}`,
  alt: `${s.alt} (testna slika)`,
  sirina: null,
  visina: null,
  zarisce: "zarisce" in s ? s.zarisce : null,
}));

export function testneSlikeVklopljene(env: Env): boolean {
  if (nastavitveR2(env)) return false;
  if (env.TESTNE_SLIKE !== undefined) return env.TESTNE_SLIKE === "1";
  return env.NODE_ENV === "production";
}

/** Vedno ista testna slika za isti ključ, da se ob osvežitvi ne menjajo. */
export function testnaSlika(kljuc: string): SlikaPogled {
  let h = 0;
  for (const znak of kljuc) h = (h * 31 + znak.codePointAt(0)!) >>> 0;
  return TESTNE_SLIKE[h % TESTNE_SLIKE.length];
}

/** Ime datoteke iz naslova lokalne slike (`/api/media/file/<ime>`) ali `null`. */
export function imeLokalneDatoteke(url: string): string | null {
  const pot = url.startsWith("/") ? url : URL.canParse(url) ? new URL(url).pathname : "";
  if (!pot.startsWith(POT_DATOTEK)) return null;
  const ime = decodeURIComponent(pot.slice(POT_DATOTEK.length).split("?")[0]);
  return ime && !ime.includes("/") ? ime : null;
}

export interface Datoteke {
  /** Ali je datoteka v mapi `media/`. */
  vMediji(ime: string): boolean;
  /** Ali je datoteka v mapi `public/`. */
  vJavni(ime: string): boolean;
}

export const datotekeNaDisku: Datoteke = {
  vMediji: (ime) => existsSync(path.resolve(process.cwd(), "media", ime)),
  vJavni: (ime) => existsSync(path.resolve(process.cwd(), "public", ime)),
};

/** Slika, ki se res prikaže: obstoječa, ista iz `public/` ali testna. */
export function popraviSliko(
  slika: SlikaPogled | null,
  kljuc: string,
  datoteke: Datoteke = datotekeNaDisku,
): SlikaPogled {
  if (!slika) return testnaSlika(kljuc);
  const ime = imeLokalneDatoteke(slika.url);
  if (ime === null || datoteke.vMediji(ime)) return slika;
  // Payload ob podvojenem imenu doda pripono (`cesen-1.jpg`).
  const izvirnik = [ime, ime.replace(/-\d+(\.[^.]+)$/, "$1")].find((i) => datoteke.vJavni(i));
  return izvirnik ? { ...slika, url: `/${izvirnik}` } : testnaSlika(kljuc);
}

export function katalogSTestnimiSlikami(k: Katalog, datoteke: Datoteke = datotekeNaDisku): Katalog {
  return {
    ...k,
    izdelki: k.izdelki.map((i) => ({
      ...i,
      slike:
        i.slike.length > 0
          ? i.slike.map((s, n) => popraviSliko(s, `izdelek:${i.slug}:${n}`, datoteke))
          : [testnaSlika(`izdelek:${i.slug}`)],
    })),
    skupine: k.skupine.map((s) => ({ ...s, slika: popraviSliko(s.slika, `skupina:${s.id}`, datoteke) })),
  };
}

export function darilaSTestnimiSlikami(d: Darila, datoteke: Datoteke = datotekeNaDisku): Darila {
  return {
    tipi: d.tipi.map((t) => ({ ...t, slika: popraviSliko(t.slika, `skatla:${t.id}`, datoteke) })),
    programi: d.programi.map((p) => ({ ...p, slika: popraviSliko(p.slika, `program:${p.slug}`, datoteke) })),
  };
}
