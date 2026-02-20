import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "meienergy.de",
      },
      {
        protocol: "https",
        hostname: "www.meienergy.de",
      },
    ],
  },
};

export default nextConfig;
