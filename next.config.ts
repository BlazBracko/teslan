import path from "node:path";
import { fileURLToPath } from "node:url";
import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(dirname),
  },
  // Na Vercelu preusmeritev apex → www izvaja platforma, na Railwayu pa aplikacija.
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
