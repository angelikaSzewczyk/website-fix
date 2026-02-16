// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";

// ✅ Consent-based GA loader + banner
import AnalyticsConsentLoader from "./components/analytics-consent-loader";
import ConsentBanner from "./components/consent-banner";

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
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "WebsiteFix" }],
    locale: "de_DE",
  },
  twitter: {
    card: "summary_large_image",
    title: "WebsiteFix — Fixpreise in 24–72h",
    description:
      "Wähle einen Fix, bezahle sicher online. Nicht umsetzbar = 100% Erstattung.",
    images: ["/og.png"],
  },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {/* ✅ GA4 loads ONLY after consent */}
        <AnalyticsConsentLoader />

        {children}

        {/* ✅ Cookie / Analytics consent banner */}
        <ConsentBanner />
      </body>
    </html>
  );
}
