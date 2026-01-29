/** @type {import('next').NextConfig} */
const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// Determine basePath based on version
const isV2 = process.env.NEXT_PUBLIC_APP_VERSION === '2.0.0-dev';
const isV1 = process.env.NEXT_PUBLIC_APP_VERSION === '1.0.0';

console.log('Next.js Config Loading:', {
  NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
  isV1,
  isV2,
  message: 'No basePath - using nginx routing with assetPrefix only'
});

const nextConfig = {
  // Standalone output for Docker production builds
  output: 'standalone',

  // CRM System - basePath i assetPrefix dla plików statycznych
  basePath: '/crm',
  assetPrefix: '/crm',
  
  // Wyłącz trailingSlash dla lepszego routingu
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
  
  // Ignore ESLint errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Skip type checking during build to speed up
  typescript: {
    ignoreBuildErrors: true,
  },

  // Disable webpack filesystem cache to avoid ENOSPC errors
  webpack: (config, { isServer }) => {
    config.cache = {
      type: 'memory',
    };
    return config;
  },

};

module.exports = withNextIntl(nextConfig);