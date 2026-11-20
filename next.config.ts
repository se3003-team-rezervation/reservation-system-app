import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Disable x-powered-by header for security
  poweredByHeader: false,
  // Strict mode for better React error detection
  reactStrictMode: true,
};

export default nextConfig;
