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
    // Only sizes actually used: grid cards (640/750/1080) and recipe detail (1200)
    deviceSizes: [640, 750, 1080, 1200],
    // Grid cards use 256/384; no thumbnails need 64/128
    imageSizes: [256, 384],
  },
};

export default nextConfig;
