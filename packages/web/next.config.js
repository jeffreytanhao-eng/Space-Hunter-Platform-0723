/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.aliyuncs.com',
      },
      {
        protocol: 'https',
        hostname: '**.myqcloud.com',
      },
      {
        protocol: 'https',
        hostname: '**.example.com',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001'}/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
