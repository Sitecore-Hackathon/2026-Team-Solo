import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "js", "jsx"],
  devIndicators: false,
  outputFileTracingRoot: path.join(process.cwd()),
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Access-Control-Allow-Private-Network",
            value: "true",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
