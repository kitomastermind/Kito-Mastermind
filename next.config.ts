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
    return [{ source: '/:path*', headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
