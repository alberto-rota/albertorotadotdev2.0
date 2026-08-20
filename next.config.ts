import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for small, production-ready Docker images (Cloud Run friendly).
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
      },
    ],
  },
};

export default nextConfig;
