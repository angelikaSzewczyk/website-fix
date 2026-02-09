import "./globals.css";
import Script from "next/script";

export const metadata = {
  title: "Website-Anfragen-Fix | 7-Tage Sprint",
  description:
    "Ich optimiere Websites so, dass Besucher verstehen, was du anbietest – und Anfragen stellen.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>
        {children}

        {/* Google Analytics 4 */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-LR9GN3WZJY"
          strategy="afterInteractive"
        />

        <Script id="ga4" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', 'G-LR9GN3WZJY', {
              anonymize_ip: true
            });
          `}
        </Script>
      </body>
    </html>
  );
}
