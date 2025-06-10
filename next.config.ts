import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    // Trim whitespace and ensure proper URL format
    const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001').trim();
    
    console.log('🔗 Next.js rewrites configured for backend:', backendUrl);
    
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
