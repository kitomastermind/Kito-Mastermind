import path from 'node:path';
import type { NextConfig } from 'next';
import { SECURITY_HEADERS } from './src/lib/security-headers';

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  serverExternalPackages: ['@react-email/render', '@react-email/components', '@react-pdf/renderer'],
  experimental: {
    staleTimes: {
      dynamic: 60,
      static: 180,
    },
  },
  async headers() {
    return [
      { source: '/:path*', headers: SECURITY_HEADERS },
      {
        source: '/og/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, immutable' },
          { key: 'Content-Type', value: 'image/png' },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: '/opengraph-image/whatsapp', destination: '/og/whatsapp.png', permanent: false },
      { source: '/opengraph-image/wide', destination: '/og/wide.png', permanent: false },
      { source: '/twitter-image', destination: '/og/twitter.png', permanent: false },
    ];
  },
};

export default nextConfig;
