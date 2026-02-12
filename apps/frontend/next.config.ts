import type { NextConfig } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    turbopackUseSystemTlsCerts: true,
  },
  
  // Exclude problematic packages from server bundle
  // These cause ESM/CJS issues with Turbopack during static generation
  serverExternalPackages: ['isomorphic-dompurify', 'jsdom'],
  
  async rewrites() {
    return [
      {
        source: '/api_be/:path*',
        destination: `${API_URL}/:path*`,
      },
    ];
  },
  
  // Disable powered by header
  poweredByHeader: false,
  
  // Disable source maps in production
  productionBrowserSourceMaps: false,
};

export default nextConfig;
