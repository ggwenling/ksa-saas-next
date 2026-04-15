import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    proxyClientMaxBodySize: "50mb",
    turbopackFileSystemCacheForBuild: true,
  },
};

export default nextConfig;
