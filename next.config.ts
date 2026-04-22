import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '12mb',
    },
  },
  // Next 16 blocks cross-origin HMR by default. When you hit the dev
  // server from a phone or another machine on the LAN, the browser
  // connects via the LAN IP rather than localhost, which trips the
  // block. List the private address ranges we actually develop across.
  // Ignored in production builds — only the dev server reads this.
  allowedDevOrigins: [
    '127.0.0.1',
    'localhost',
    '10.*.*.*',
    '172.16.*.*',
    '172.17.*.*',
    '172.18.*.*',
    '172.19.*.*',
    '172.20.*.*',
    '172.21.*.*',
    '172.22.*.*',
    '172.23.*.*',
    '172.24.*.*',
    '172.25.*.*',
    '172.26.*.*',
    '172.27.*.*',
    '172.28.*.*',
    '172.29.*.*',
    '172.30.*.*',
    '172.31.*.*',
    '192.168.*.*',
  ],
};

export default nextConfig;
