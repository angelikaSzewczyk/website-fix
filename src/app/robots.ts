import { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',      // Schützt deine OG-Bild-Generierung vor Spam
          '/_next/',     // Verhindert das Crawlen von Next.js Internals
          '/admin/',    // Falls du später ein Dashboard baust
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