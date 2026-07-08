import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker standalone 빌드 (.next/standalone/server.js 생성)
  output: "standalone",
};

export default nextConfig;
