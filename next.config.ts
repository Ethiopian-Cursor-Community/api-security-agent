import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@cursor/sdk"],
  turbopack: {
    resolveAlias: {
      "@cursor/sdk": "@cursor/sdk/dist/esm/index.js",
    },
  },
};

export default nextConfig;
