import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  serverExternalPackages: ['@react-email/render', '@react-email/components', '@react-pdf/renderer'],
};

export default nextConfig;
