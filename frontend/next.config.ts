import type { NextConfig } from "next";

// No Docker use http://backend:3333; no PC (npm run dev) use http://localhost:3333
const apiInternal = process.env.API_INTERNAL_URL || 'http://localhost:3333';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiInternal}/api/:path*`,
      },
      {
        source: '/arquivos/:path*',
        destination: `${apiInternal}/arquivos/:path*`,
      },
    ];
  },
};

export default nextConfig;
