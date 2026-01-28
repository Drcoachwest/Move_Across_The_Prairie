import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    tsconfigPath: "./tsconfig.json",
  },
  webpack: (config) => {
    return config;
  },
};

export default nextConfig;
