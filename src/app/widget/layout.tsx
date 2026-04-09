import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gratis Check — Powered by WebsiteFix",
  description:
    "KI-Analyse deiner Website in Sekunden — kostenlos und unverbindlich.",
  robots: { index: false },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
};

export default function WidgetLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
