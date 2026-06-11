import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "journals.stmjournals.com",
      },
      {
        protocol: "https",
        hostname: "shop.stmjournals.com",
      },
      {
        protocol: "https",
        hostname: "journalspub.com",
      },
    ],
  },
  output: "standalone",
};

export default nextConfig;
