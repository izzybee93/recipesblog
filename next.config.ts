import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.github.io',
        port: '',
        pathname: '/**',
      },
    ],
    // Use only webp to halve transformations (avif is slower to encode anyway)
    formats: ['image/webp'],
    // Cache optimized images for 31 days
    minimumCacheTTL: 2678400,
    // Limit device sizes for a recipe blog (don't need 4K)
    deviceSizes: [640, 750, 1080, 1200, 1920],
    // Limit image sizes for thumbnails
    imageSizes: [64, 128, 256, 384],
  },
};

export default nextConfig;
