/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: '/__/auth/:path*',
        destination: `https://woc-platform-seoul-1234.firebaseapp.com/__/auth/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
