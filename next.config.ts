import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

export default nextConfig;
