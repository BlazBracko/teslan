import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { okolje } from "@/env";
import { Styleguide } from "./Styleguide";

/**
 * Slogovni vodnik (Z4): barve, tipografija in vse komponente v vseh
 * stanjih. Obstaja samo, ko je `NOINDEX=1` (staging, razvoj); sicer 404.
 */

export const metadata: Metadata = {
  title: "Slogovni vodnik — Domačija Tešlan",
  robots: { index: false, follow: false },
};

export default async function StyleguidePage() {
  // Okolje beremo ob zahtevi, ne ob gradnji: ista gradnja teče na stagingu
  // (NOINDEX=1) in v produkciji.
  await connection();
  if (!slogovniVodnikVidni()) notFound();
  return <Styleguide />;
}

function slogovniVodnikVidni() {
  return okolje().NOINDEX === "1";
}
