/** @type {import('next').NextConfig} */
const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig = {
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

module.exports = withNextIntl(nextConfig);
