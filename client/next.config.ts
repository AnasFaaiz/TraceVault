import type { NextConfig } from "next";

// Ensure we don't have a trailing slash in the origin
const backendOrigin = (process.env.BACKEND_ORIGIN || "http://127.0.0.1:4000").replace(/\/$/, "");

const nextConfig: NextConfig = {
  reactCompiler: true,
  async rewrites() {
    return [
      {
        // This takes any call to tracevault.vercel.app/api/... 
        // and sends it to your EC2 IP
        source: '/api/:path*',
        destination: `${backendOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;