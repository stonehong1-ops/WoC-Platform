/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  images: {
    unoptimized: true,
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
