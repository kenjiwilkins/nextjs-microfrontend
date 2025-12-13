import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  basePath: '/admin',
  output: 'standalone',
};

export default nextConfig;
