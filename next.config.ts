import type { NextConfig } from "next";

const isStaticBuild = process.env.BUILD_STATIC === "1";

const nextConfig: NextConfig = {
  output: isStaticBuild ? "export" : "standalone",
  images: { unoptimized: true },
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
