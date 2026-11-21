import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  logging: {
    incomingRequests: { ignore: [/\/bbs-control\/recuperar\/confirmar(?:\?|$)/] },
  },
};

export default nextConfig;
