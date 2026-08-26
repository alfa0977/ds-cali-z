import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use standalone for server mode, export for static APK mode
  // Change to "export" when building for APK
  output: process.env.BUILD_STATIC === "1" ? "export" : "standalone",
  images: { unoptimized: true },
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
