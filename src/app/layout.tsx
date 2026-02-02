import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
