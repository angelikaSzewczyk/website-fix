/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'website-fix.com',
          },
        ],
        destination: 'https://www.website-fix.com/:path*',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
