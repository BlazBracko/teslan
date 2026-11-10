"use client";

import { LazyMotion } from "framer-motion";

const funkcije = () => import("./gibanje-funkcije").then((m) => m.default);

/**
 * Framer Motion z odloženimi funkcijami (S18): komponente uporabljajo
 * lahke `m.*` elemente, animacije in vlečenje (`domMax`) pa se naložijo
 * kot ločen kos po hidraciji, da ne tekmujejo z glavno sliko strani.
 * `strict` ob uporabi težkega `motion.*` znotraj tega ovoja vrže napako.
 */
export function Gibanje({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={funkcije} strict>
      {children}
    </LazyMotion>
  );
}
