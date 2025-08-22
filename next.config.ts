import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  // Enable Turbopack optimizations
  transpilePackages: ['@trpc/client', '@trpc/server', '@trpc/react-query'],
}

export default nextConfig