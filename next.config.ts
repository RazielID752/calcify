import type { NextConfig } from "next";

const API_BASE_URL =
  process.env.CALCIFY_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "https://api-calcify-production.up.railway.app";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: "/__calcify_api/:path*",
        destination: `${API_BASE_URL.replace(/\/+$/, "")}/:path*`,
      },
    ];
  },
  ...(process.env.NEXT_OUTPUT_EXPORT === "1" ? { output: "export" } : {}),
};

export default nextConfig;
