import path from "path";
import type { NextConfig } from "next";

const monorepoRoot = path.join(__dirname, "../../");

const nextConfig: NextConfig = {
  transpilePackages: ["@tokenuity/store", "@tokenuity/types"],
  turbopack: {
    root: monorepoRoot,
  },
  outputFileTracingRoot: monorepoRoot,
};

export default nextConfig;