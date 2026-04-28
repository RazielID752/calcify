import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  ...(process.env.NEXT_OUTPUT_EXPORT === "1" ? { output: "export" } : {}),
};

export default nextConfig;
