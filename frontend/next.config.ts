import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3333/api/:path*' // O Frontend vai buscar no Backend escondido!
      },
      {
        source: '/arquivos/:path*',
        destination: 'http://localhost:3333/arquivos/:path*' // Para as fotos e PDFs do repositório
      }
    ];
  }
};

export default nextConfig;