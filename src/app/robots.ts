import { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',        // Alle API-Routes — inkl. OG, Webhooks, Scan-Endpoints
          '/admin/',      // Admin-Bereich
          '/dashboard/',  // Nutzer-Dashboard (eingeloggter Bereich)
          '/scan/',       // Scan-Ergebnisse (nutzerspezifisch)
          '/checkout/',   // Stripe Checkout
          '/login',       // Auth-Seiten
          '/register',
          '/reset-password',
          '/forgot-password',
          '/widget/',     // Widget-Embed (kein SEO-Wert)
        ],
      },
      {
        // Spezielle Regel für KI-Bots (optional, falls du nicht willst, 
        // dass ChatGPT & Co. deine Texte zum Training nutzen)
        userAgent: ['GPTBot', 'ChatGPT-User'],
        disallow: '/',
      }
    ],
    sitemap: 'https://website-fix.com/sitemap.xml',
  }
}