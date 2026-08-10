import type { Transition, Variants } from 'framer-motion';

/**
 * Motion sistem po Applovem modelu iz *Designing Fluid Interfaces*.
 *
 * Apple je fiziko (mass/stiffness/damping) namenoma zamenjal z dvema
 * parametroma: **damping ratio** (koliko prekorači cilj) in **response**
 * (kako hitro doseže cilj). Framer Motion ima natanko ta dva pod imeni
 * `bounce` in `visualDuration`, zato tu ne nastavljamo stiffness/damping —
 * ta bi bounce/visualDuration prepisala.
 *
 *   damping 1.0  ->  bounce 0     (kritično dušen, brez prekoračitve)
 *   damping 0.8  ->  bounce 0.2   (rahel odboj)
 *   response     ->  visualDuration (v sekundah)
 *
 * Pravilo: privzeto damping 1.0. Odboj samo takrat, kadar je gesta sama
 * nosila moment (flick, met, spust vlečenja). Prekoračitev na meniju, ki
 * se je samo pojavil, je narobe; na kartici, ki si jo vrgel, je pravilna.
 */

/** Premik / repozicioniranje — Applova tabela: damping 1.0, response 0.4 */
export const springMove: Transition = {
  type: 'spring',
  bounce: 0,
  visualDuration: 0.4,
};

/** Rotacija — damping 0.8, response 0.4 */
export const springRotate: Transition = {
  type: 'spring',
  bounce: 0.2,
  visualDuration: 0.4,
};

/** Predal / sheet — damping 0.8, response 0.3 */
export const springSheet: Transition = {
  type: 'spring',
  bounce: 0.2,
  visualDuration: 0.3,
};

/** Privzeti UI spring: brez prekoračitve, dovolj hiter, da ne zadržuje. */
export const springUI: Transition = {
  type: 'spring',
  bounce: 0,
  visualDuration: 0.35,
};

/** Takojšen odziv na pritisk — mora biti pod mejo zaznave zamika (§1). */
export const springSnap: Transition = {
  type: 'spring',
  bounce: 0,
  visualDuration: 0.18,
};

/** Spust geste z momentom — edini primer, kjer je odboj upravičen. */
export const springMomentum: Transition = {
  type: 'spring',
  bounce: 0.2,
  visualDuration: 0.4,
};

/** Reduced motion: navzkrižni preliv, brez vzbujanja vestibularnega sistema. */
export const crossFade: Transition = {
  duration: 0.2,
  ease: 'linear',
};

/**
 * Applova funkcija za projekcijo momenta iz vzorčne kode
 * *Designing Fluid Interfaces*. Vrne, koliko pikslov bo gesta še
 * potovala po spustu — ciljno točko izberemo glede na to projekcijo,
 * ne glede na točko spusta. Tako flick res "vrže" element.
 *
 * Pozor: učbeniška v²/(2·a) NI to, kar Apple pošilja v produkcijo.
 * Uporabljamo eksponentni razpad, enako kot deceleracija scrolla.
 *
 * @param velocity px/s ob spustu
 * @param decelerationRate 0.998 = običajen scroll, 0.99 = bolj odsekan
 */
export function project(velocity: number, decelerationRate = 0.998): number {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/**
 * Rubber-banding (§9): čim dlje čez mejo uporabnik vleče, tem manj
 * element sledi. Trd ustavek se bere kot "zamrznjeno", postopen upor
 * kot "odziven, ampak tu ni več nič".
 */
export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

/**
 * Odločitev ob spustu geste: predznak hitrosti prevlada nad položajem.
 * Če uporabnik očitno vleče nazaj, ga ne zapremo, tudi če je čez polovico.
 *
 * @param offset trenutni odmik od izhodišča (px)
 * @param velocity hitrost ob spustu (px/s)
 * @param threshold točka, čez katero se poteza uveljavi (px)
 */
export function shouldCommit(offset: number, velocity: number, threshold: number): boolean {
  return offset + project(velocity) > threshold;
}

/* ─────────────────────────────────────────────────────────────
   Variante za razkrivanje ob scrollu

   Vsaka ima dvojnico za reduced motion: ista sprememba opacity,
   brez premika. Reduced motion ne pomeni brez odziva (§14).
   ───────────────────────────────────────────────────────────── */

export const revealUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: springUI },
};

export const revealUpReduced: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: crossFade },
};

export const revealFromLeft: Variants = {
  hidden: { opacity: 0, x: -32 },
  visible: { opacity: 1, x: 0, transition: springUI },
};

export const revealFromRight: Variants = {
  hidden: { opacity: 0, x: 32 },
  visible: { opacity: 1, x: 0, transition: springUI },
};

export const revealScale: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: springUI },
};

/**
 * Stagger med otroki. Držimo ga kratkega — dolg stagger na dolgem
 * seznamu pomeni, da zadnji element čaka, in to se bere kot zamik.
 */
export const staggerChildren = (stagger = 0.06, delayChildren = 0): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger, delayChildren } },
});

/** Izbere pravo varianto glede na uporabnikovo preferenco. */
export function reveal(variants: Variants, reduceMotion: boolean | null): Variants {
  return reduceMotion ? revealUpReduced : variants;
}
