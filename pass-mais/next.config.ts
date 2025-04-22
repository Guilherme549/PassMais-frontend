import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = {
  images: {
    unoptimized: true,
  },
}

export default nextConfig;
