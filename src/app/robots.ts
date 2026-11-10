import type { MetadataRoute } from "next";
import { okolje } from "@/env";
import { izvorStrani } from "@/seo/izvor";
import { pravilaRobots } from "@/seo/robots";

/** Okolje se bere ob zahtevi: ista gradnja teče na stagingu (`NOINDEX=1`) in v produkciji. */
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const env = okolje();
  return pravilaRobots(env.NOINDEX === "1", izvorStrani(env));
}
