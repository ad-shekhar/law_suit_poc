import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { allowedOrigins: ["localhost:3000"] },
  },
  images: {
    domains: ["avatars.githubusercontent.com", "lh3.googleusercontent.com"],
  },
  env: {
    NEXT_PUBLIC_APP_NAME: "LegalOS",
    NEXT_PUBLIC_APP_TAGLINE: "AI That Lawyers Control",
  },
};

export default nextConfig;
