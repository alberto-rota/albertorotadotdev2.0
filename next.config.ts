import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for small, production-ready Docker images (Cloud Run friendly).
  output: "standalone",
};

export default nextConfig;
