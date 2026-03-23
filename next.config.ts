import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  rewrites: async () => [
    {
      source: "/va/script.js",
      destination: "https://cloud.umami.is/script.js",
    },
    {
      source: "/va/api/send",
      destination: "https://cloud.umami.is/api/send",
    },
  ],
};

export default nextConfig;
