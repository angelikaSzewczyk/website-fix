import type { Metadata } from "next";
import BlogHeader from "../components/blog-header";
import SiteFooter from "../components/SiteFooter";
import PluginReportClient from "./PluginReportClient";

/**
 * /plugin-report — Lead-Capture-Landing für Nutzer, die aus dem
 * WordPress-Health-Check-Plugin kommen. Server-Page liest die UTM-Params
 * und reicht sie an die Client-Komponente weiter (Form-Submit erhält die
 * Quelle für Lead-Tracking).
 *
 * SEO: noindex — das ist keine generische Landing, sondern eine Funnel-Page
 * mit "Bericht entsperren"-Mechanik. Soll nicht im Google-Index landen,
 * sonst werden organische Besucher unnötig mit einer Email-Wall konfrontiert.
 */
export const metadata: Metadata = {
  title:       "Dein WordPress Health-Check ist bereit · WebsiteFix",
  description: "Vollständiger 92-Punkt-Audit deiner WordPress-Site: Datenbank-Bloat, PHP-Errors, Hook-Chain-Konflikte. Plugin-User: hier den Bericht freischalten.",
  robots:      { index: false, follow: false },
};

export default async function PluginReportPage({
  searchParams,
}: {
  searchParams: Promise<{ utm_source?: string; utm_medium?: string; utm_campaign?: string; url?: string }>;
}) {
  const sp = await searchParams;
  return (
    <>
      <BlogHeader active="none" lang="de" />
      <PluginReportClient
        source={sp.utm_source ?? "wp-plugin"}
        medium={sp.utm_medium ?? null}
        campaign={sp.utm_campaign ?? null}
        siteUrl={sp.url ?? null}
      />
      <SiteFooter />
    </>
  );
}
