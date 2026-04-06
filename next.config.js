/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/blog/website-langsamer-ladezeit-fixes',
        destination: '/blog/website-zu-langsam',
        permanent: true,
      },
      {
        source: '/fixes',
        destination: '/',
        permanent: true,
      },
    ]
  },
};

module.exports = nextConfig;
