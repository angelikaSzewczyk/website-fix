/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : [config.externals]).filter(Boolean),
        "playwright-core",
        "@sparticuz/chromium-min",
      ];
    }
    return config;
  },
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
