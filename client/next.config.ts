import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://54.234.194.97:4000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
