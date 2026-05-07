/** @type {import('next').NextConfig} */
const nextConfig = {
  // Plugin-Download-Assets liegen außerhalb von public/, damit sie nicht
  // statisch ausgeliefert werden — der /api/plugin/download-Endpoint
  // streamt sie nach Auth-Check. Vercel muss den Ordner trotzdem in den
  // Serverless-Function-Bundle aufnehmen, sonst ENOENT zur Laufzeit.
  outputFileTracingIncludes: {
    "/api/plugin/download": ["./private-assets/plugin/**/*"],
    "/api/plugin/download/[file]": ["./private-assets/plugin/**/*"],
  },
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
      // legacy URL → renamed slug
      {
        source: '/blog/website-langsamer-ladezeit-fixes',
        destination: '/blog/website-laedt-extrem-langsam',
        permanent: true,
      },
      {
        source: '/fixes',
        destination: '/',
        permanent: true,
      },
      // duplicate consolidations
      {
        source: '/blog/google-findet-meine-seite-nicht-5-gruende-fuer-fehlenede-indexierung',
        destination: '/blog/google-findet-deine-website-nicht',
        permanent: true,
      },
      {
        source: '/blog/kontaktformular-sendet-keine-e-mails-so-loest-du-das-smtp-problem',
        destination: '/blog/kontaktformular-funktioniert-nicht',
        permanent: true,
      },
      {
        source: '/blog/website-zu-langsam',
        destination: '/blog/website-laedt-extrem-langsam',
        permanent: true,
      },
      {
        source: '/blog/website-nicht-erreichbar',
        destination: '/blog/website-nicht-erreichbar-checkliste-zur-schnellen-fehlerbehebung',
        permanent: true,
      },
      {
        source: '/blog/website-zeigt-nur-white-screen-wie-loesen',
        destination: '/blog/website-zeigt-nur-weisse-seite',
        permanent: true,
      },
      {
        source: '/blog/wordpress-zeigt-nur-eine-weisse-seite-so-loest-du-das-problem',
        destination: '/blog/website-zeigt-nur-weisse-seite',
        permanent: true,
      },
    ]
  },
};

module.exports = nextConfig;
