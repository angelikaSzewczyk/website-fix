// app/layout.tsx
import "./globals.css";
import Script from "next/script";
import type { Metadata } from "next";
import AnalyticsPageViews from "./components/analytics-pageviews";


const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-LR9GN3WZJY";


// ⚠️ später: echte Domain eintragen (wichtig für OG/canonical)
const SITE_URL = "https://websitefix.io";

export const metadata: Metadata = {
  title: {
    default: "WebsiteFix — Fixpreise in 24–72h",
    template: "%s · WebsiteFix",
  },
  description:
    "Website kaputt? Wir fixen das. Fixpreise · 24–72h · systemunabhängig. Sicher bezahlen — nicht umsetzbar = 100% Erstattung.",
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "WebsiteFix",
    title: "WebsiteFix — Fixpreise in 24–72h",
    description:
      "Wähle einen Fix, bezahle sicher online. Machbarkeits-Check inklusive — nicht umsetzbar = 100% Erstattung.",
    images: [
      { url: "/og.png", width: 1200, height: 630, alt: "WebsiteFix" },
    ],
    locale: "de_DE",
  },
  twitter: {
    card: "summary_large_image",
    title: "WebsiteFix — Fixpreise in 24–72h",
    description:
      "Wähle einen Fix, bezahle sicher online. Nicht umsetzbar = 100% Erstattung.",
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}

        {/* GA4 library */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />

        {/* GA4 init (send_page_view false -> we do manual SPA page views) */}
        <Script id="ga4" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;

            gtag('js', new Date());
            gtag('config', '${GA_ID}', {
              anonymize_ip: true,
              send_page_view: false
            });
          `}
        </Script>

        {/* App Router page_view tracking */}
        <AnalyticsPageViews gaId={GA_ID} />
      </body>
    </html>
  );
}
