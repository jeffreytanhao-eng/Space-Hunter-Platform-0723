/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    // 图片域名占位，后续根据实际需求配置
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.example.com',
      },
    ],
  },
}

module.exports = nextConfig
