import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Disable x-powered-by header for security
  poweredByHeader: false,
  // Strict mode for better React error detection
  reactStrictMode: true,
};

export default nextConfig;
