import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  rewrites: async () => [
    {
      source: "/va/script.js",
      destination: "https://cloud.umami.is/script.js",
    },
  ],
};

export default nextConfig;
