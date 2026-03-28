/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  compress: true,
  
  // Image optimization
  images: {
    unoptimized: true, // Disable Next.js image optimization for production deployment
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Turbopack config (empty to silence warning - Next.js 16 default)
  turbopack: {},
};

export default nextConfig;


