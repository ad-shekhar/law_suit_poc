import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { allowedOrigins: ["localhost:3000"] },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  env: {
    NEXT_PUBLIC_APP_NAME: "LegalOS",
    NEXT_PUBLIC_APP_TAGLINE: "AI That Lawyers Control",
  },
};

export default nextConfig;
