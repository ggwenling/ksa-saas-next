import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    proxyClientMaxBodySize: "50mb",
    turbopackFileSystemCacheForBuild: true,
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
