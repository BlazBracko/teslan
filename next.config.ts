import path from "node:path";
import { fileURLToPath } from "node:url";
import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Slike iz Cloudflare R2 (Z83) so na drugem izvoru; slike z lokalnega diska
// so relativne (`/api/media/file/…`, gl. src/katalog/slike.ts).
const r2 = process.env.S3_PUBLIC_URL ? new URL(process.env.S3_PUBLIC_URL) : undefined;

const nextConfig: NextConfig = {
  experimental: {
    // Lastna stran 404 za neobstoječe poti (src/app/global-not-found.tsx):
    // aplikacija ima dva korenska layouta, zato je privzeta brez jezika (S17).
    globalNotFound: true,
  },
  turbopack: {
    root: path.resolve(dirname),
  },
  images: {
    // AVIF je pri fotografijah za tretjino do polovico manjši od WebP, kar na
    // mobilnem omrežju skrajša nalaganje glavne slike (S18). Brskalniki brez
    // AVIF dobijo WebP.
    formats: ["image/avif", "image/webp"],
    remotePatterns: r2
      ? [
          {
            protocol: r2.protocol.replace(":", "") as "http" | "https",
            hostname: r2.hostname,
            pathname: `${r2.pathname.replace(/\/+$/, "")}/**`,
          },
        ]
      : [],
  },
  // Preusmeritev apex → www (Railway tega ne naredi sam, zato jo izvede aplikacija).
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "teslan.si" }],
        destination: "https://www.teslan.si/:path*",
        permanent: true,
      },
    ];
  },
};

export default withPayload(nextConfig, { devBundleServerPackages: false });
