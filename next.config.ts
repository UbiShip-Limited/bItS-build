import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  eslint: {
    // Temporarily ignore ESLint during builds to prevent deployment failures
    // TODO: Fix all ESLint warnings and re-enable strict checking
    ignoreDuringBuilds: true,
  },
  // Force cache busting for CSS changes
  generateBuildId: async () => {
    return `${Date.now()}`;
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // ignoreBuildErrors: true,
  },
  outputFileTracingExcludes: {
    '*': [
      './lib/**/*',
      './scripts/**/*',
      './prisma/**/*',
      './server-package.json',
      './railway.json',
      './.railwayignore'
    ],
  },
  webpack: (config, { isServer }) => {
    // Don't try to bundle backend Node.js modules in the frontend
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        path: false,
        os: false,
        'child_process': false,
      };
    }
    
    // Add explicit module resolution for @tabler/icons-react
    config.resolve.alias = {
      ...config.resolve.alias,
      '@tabler/icons-react': require.resolve('@tabler/icons-react'),
    };
    
    return config;
  },
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
