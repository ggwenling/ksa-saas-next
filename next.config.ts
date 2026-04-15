import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    proxyClientMaxBodySize: "50mb",
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
