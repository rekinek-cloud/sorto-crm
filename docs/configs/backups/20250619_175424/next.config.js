/** @type {import('next').NextConfig} */

// Determine basePath based on version  
const isV2 = process.env.NEXT_PUBLIC_APP_VERSION === '2.0.0-dev';
const isV1 = process.env.NEXT_PUBLIC_APP_VERSION === '1.0.0';

console.log('Next.js Config Loading:', {
  NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
  isV1,
  isV2,
  message: isV1 ? 'Using basePath: /crm' : (isV2 ? 'Using basePath: /crm2' : 'No basePath')
});

const nextConfig = {
  // Set basePath based on version - disabled for nginx routing
  // ...(isV1 && { basePath: '/crm' }),
  // ...(isV2 && { basePath: '/crm2' }),
  
  // Set assetPrefix for static assets
  ...(isV1 && { assetPrefix: '/crm' }),
  ...(isV2 && { assetPrefix: '/crm2' }),
  
  // Handle trailing slashes consistently
  trailingSlash: true,
  
  // Ignore ESLint errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Skip type checking during build to speed up
  typescript: {
    ignoreBuildErrors: false,
  },
  
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/v1/:path*',
      },
    ];
  },
};

module.exports = nextConfig;