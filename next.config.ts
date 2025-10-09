import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Ensure public folder assets are accessible
  outputFileTracingIncludes: {
    '/': ['./public/**/*'],
  },
};

export default nextConfig;
