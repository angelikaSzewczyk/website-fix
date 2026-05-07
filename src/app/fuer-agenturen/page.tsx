import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import {
  Layers, BellDot, Globe, ShieldCheck, Zap, Server, Palette,
  Headphones, Magnet, Crown, Check,
  Wallet, Users, Bell, Lock, FileText, AlertTriangle,
} from "lucide-react";
import { JiraIcon, AsanaIcon, TrelloIcon, SlackIcon } from "../components/BrandIcons";
import FaqAccordion from "../components/faq-accordion";
import RoiCalculator from "../components/roi-calculator";
import CheckoutButton from "../components/checkout-button";
import AutoCheckout from "../components/auto-checkout";
import BrandLogo from "../components/BrandLogo";
import MobileNav from "../components/MobileNav";
import AgencyStats from "../components/agency-stats";
import SiteFooter from "../components/SiteFooter";
import MaintenanceBanner from "../components/MaintenanceBanner";
import CancelBanner from "./CancelBanner";
import ComparisonToggle from "./ComparisonToggle";
import PricingFeatureTable from "./PricingFeatureTable";
import { getLatestAgencyPost, categoryTheme } from "@/lib/blog-loader";
import PluginInfobox from "../components/PluginInfobox";

// ─── SEO-Metadata ────────────────────────────────────────────────────────────
// Reframing zu "Profit-Center" — Such-Intention "WordPress-Agentur skalieren",
// "Werkstudent Aufgaben WordPress", "Senior-Dev Lohnkosten sparen" mit
// abgreifen ohne Keyword-Stuffing. Description spricht den Inhaber direkt an.
export const metadata: Metadata = {
  title:       { absolute: "Für Agenturen | Marge skalieren statt Senior-Devs verheizen" },
  description: "Verwandeln Sie Ihre WordPress-Agentur vom Notfall-Fixer zum Profit-Center. Mit Smart-Fix-Guides erledigen Junior-Devs Aufgaben, für die bisher teure Senior-Stunden anfielen. White-Label, 60s-Watchdog, Team-Rollen und Workflow-Integration ab 249 €/Monat.",
  alternates:  { canonical: "https://website-fix.com/fuer-agenturen" },
  openGraph: {
    title:       "Für Agenturen | Marge skalieren statt Senior-Devs verheizen",
    description: "Vom Notfall-Fixer zum Profit-Center: Junior-Delegation, 60s-Watchdog, White-Label-Mandantenportal, Workflow-Integration. Ab 249 €/Monat.",
    url:         "https://website-fix.com/fuer-agenturen",
    type:        "website",
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Für Agenturen | Marge skalieren statt Senior-Devs verheizen",
    description: "Vom Notfall-Fixer zum Profit-Center: Junior-Delegation, 60s-Watchdog, White-Label-Mandantenportal, Workflow-Integration.",
  },
};

// ─── Plan-Reframing ──────────────────────────────────────────────────────────
// Drei klar abgegrenzte Audiences, KEIN "mehr-vom-gleichen"-Schema:
//   • Starter   — Solo-Macher, 1 Projekt
//   • Professional — Selbst-Macher / Effizienz: der Owner-Operator, der schneller fixt
//   • Agency Scale — Infrastruktur / Management: Chef-Perspektive, delegiert + skaliert
// Die Feature-Listen pro Tier folgen dieser Logik und vermeiden, dass Agency
// Scale wie "Pro mit doppelt so vielen Slots" wirkt.
// KEEP SYNCED with src/app/page.tsx — beide Pages müssen Inhalt + Audience
// + Badges identisch zeigen, sonst Vertrauensbruch beim Tab-Wechsel.
//
// Stripe-Mapping: planKey → STRIPE_PRICE_<UPPERCASE>-Env-Var
// (siehe priceIdToPlan in /api/webhooks/stripe). In Vercel:
//   STRIPE_PRICE_STARTER       → "starter"
//   STRIPE_PRICE_PROFESSIONAL  → "professional"
//   STRIPE_PRICE_AGENCY        → "agency"
// Pay-per-Fix (9,90 €) läuft NICHT über die PLANS — eigener anon-checkout-
// Flow (siehe /api/guides/[id]/anon-checkout).
type PlanFeature = { text: string; highlight: boolean; locked?: boolean; key?: boolean };
type Plan = {
  name: string; planKey: string; price: string; per: string;
  desc: string; audience: string; accent: string;
  features: PlanFeature[];
  audienceFootnote?: string;
  cta: string;
  /** Set this for non-Stripe CTAs (z.B. Starter → /scan für Pay-per-Fix-Lead) */
  href: string | undefined;
  recommended: boolean;
  enterprise: boolean;
  /** Optional Badge-Text für die Top-Stripe ("★ Beliebtestes Paket" usw.) */
  badge?: string;
};

const PLANS: Plan[] = [
  {
    name: "Starter",
    planKey: "starter",
    price: "29",
    per: "/Monat",
    desc: "Für kleine Portfolios bis 3 Projekte",
    audience: "Selbstständige · 1–2 Kundenprojekte",
    accent: "#60a5fa",
    features: [
      { text: "Bis zu 3 Projekte · wöchentlicher Deep-Scan",         highlight: true, key: true },
      { text: "🔒 Inkl. Deep-Scan Plugin (Read-Only)",               highlight: true, key: true },
      { text: "Basis-Monitoring (Uptime + Score-Trend)",             highlight: true, key: true },
      { text: "Smart-Fix-Guides — 5 inklusive, weitere 9,90 €",      highlight: true },
      { text: "SEO-, Technik- & Sicherheits-Check",                  highlight: false },
      { text: "Kein White-Label",                                    highlight: false, locked: true },
      { text: "Keine Team-Rollen",                                   highlight: false, locked: true },
      { text: "Kein Mandanten-Portal",                               highlight: false, locked: true },
    ],
    audienceFootnote: "Ideal für Selbstständige mit eigener Website + 1–2 Kundenprojekten.",
    cta: "Starter wählen",
    href: undefined,
    recommended: false,
    enterprise: false,
  },
  {
    name: "Professional",
    planKey: "professional",
    price: "89",
    per: "/Monat",
    desc: "Effizienz für Selbst-Macher & Freelancer",
    audience: "Owner-Operator · Solo-Pro",
    accent: "#10B981",
    features: [
      { text: "10 WordPress-Projekte · unbegrenzte Scans",                   highlight: true, key: true },
      { text: "🔒 Deep-Scan Plugin · KI-Analyse aller Befunde",              highlight: true, key: true },
      { text: "Smart-Fix-Drawer mit Builder-Anleitung (Elementor / Divi)",   highlight: true, key: true },
      { text: "KI-Auto-Fix — Copy-Paste-Code direkt im Drawer",              highlight: true, key: true },
      { text: "White-Label PDF (Logo + Brand-Farbe)",                        highlight: true },
      { text: "Score-Verlauf · Client-Tracking · 24/7-Monitoring",           highlight: true },
      { text: "Executive Summary für Endkunden-Reports",                     highlight: false },
    ],
    audienceFootnote: "Für Freelancer und wachsende Web-Projekte mit bis zu 10 Mandanten.",
    cta: "Professional starten",
    href: undefined,
    recommended: true,
    enterprise: false,
    badge: "★ Beliebtestes Paket",
  },
  {
    name: "Agency Scale",
    planKey: "agency",
    price: "249",
    per: "/Monat",
    desc: "Infrastruktur & Profit-Maximierung für Inhaber",
    audience: "Agentur-Chef · Mandantengeschäft",
    accent: "#A78BFA",
    features: [
      { text: "Bis zu 50 Mandanten · unbegrenzte Scans",                                 highlight: true, key: true },
      { text: "🔒 White-Label Plugin (Dein Branding beim Endkunden)",                    highlight: true, key: true },
      { text: "Delegations-Hebel im Dashboard (Junior-Lohnkosten-Ersparnis)",            highlight: true, key: true },
      { text: "Embeddable Lead-Generator — Scanner mit deinem Logo auf deiner Website",  highlight: true, key: true },
      { text: "Mandanten-Portal unter Ihrer eigenen Subdomain",                          highlight: true, key: true },
      { text: "Team-Rollen: Admin, Editor (Junior), Viewer — granular",                  highlight: true, key: true },
      { text: "60-Sekunden-Watchdog mit Slack-/E-Mail-Alarm bei Ausfall",                highlight: true, key: true },
      { text: "Workflow-API: Jira, Trello, Asana, Zapier — automatisch verbucht",        highlight: true },
      { text: "DSGVO-AVV, Audit-Log + Haftungs-Dokumentation",                           highlight: true },
      { text: "Priority-Onboarding: 60-Min-Setup-Call mit Account-Manager",              highlight: false },
    ],
    audienceFootnote: "Für Agentur-Inhaber, die Wartung profitabel skalieren wollen.",
    cta: "Agentur-Marge jetzt skalieren →",
    href: undefined,
    recommended: false,
    enterprise: false,
    badge: "💎 Bester ROI",
  },
];

// ─── Workflow-Integrationen (Logo-Strip) ────────────────────────────────────
// Brand-SVGs aus components/BrandIcons. Wenn neue Integrationen hinzukommen
// (Linear, ClickUp, Notion …): dort Component ergänzen + hier eintragen.
const WORKFLOW_INTEGRATIONS: Array<{ name: string; desc: string; Icon: (props: { size?: number }) => React.ReactElement }> = [
  { name: "Jira",    desc: "Issues werden automatisch als Tickets im richtigen Sprint angelegt.",        Icon: JiraIcon },
  { name: "Asana",   desc: "Befunde landen direkt im richtigen Projekt mit Verantwortlichem.",            Icon: AsanaIcon },
  { name: "Trello",  desc: "Karten werden mit Severity-Label im konfigurierten Board erstellt.",          Icon: TrelloIcon },
  { name: "Slack",   desc: "60-Sekunden-Watchdog meldet Ausfall sofort im konfigurierten Channel.",       Icon: SlackIcon },
];

// ─── FAQ — überarbeitet auf Agency-Inhaber-Perspektive ──────────────────────
// "Sie"-Form, B2B-Wording (Haftung, Mandanten, Marge, Delegation). Pricing
// vollständig: 9,90 € Pay-per-Fix, 29 € Starter, 89 € Pro, 249 € Agency
// Scale. Read-Only-Plugin + Hoster-Kompatibilität explizit beantwortet.
const FAQ = [
  {
    q: "Wie genau spare ich Senior-Lohnkosten — was kann ein Junior wirklich übernehmen?",
    a: "Etwa 60–75 % aller Befunde, die unsere Engine findet, lassen sich im WordPress-Backend ohne Code-Eingriff lösen: Alt-Texte, Meta-Descriptions, Title-Tags, Sitemap-Toggles, Cookie-Banner-Konfig, Yoast/Rank-Math-Settings, Image-Alt im Medien-Manager. Unsere Smart-Fix-Guides sind so geschrieben, dass ein Werkstudent mit 3 Monaten WP-Erfahrung sie umsetzen kann. Im Agency-Dashboard sehen Sie pro Mandant exakt: \"X von Y Issues durch Junior lösbar\" — inkl. konkreter Lohnkosten-Ersparnis. Bei 50 Mandanten und 3 Junior-lösbaren Fixes pro Monat ergibt das rechnerisch eine Marge-Steigerung von ca. 9.750 €/Monat (Senior 100 €/h vs. Junior 35 €/h, je 1 h pro Fix).",
  },
  {
    q: "Was macht das Read-Only-Plugin und ist es sicher für Mandanten-Sites?",
    a: "Das Plugin ist explizit Read-Only: Es liest WordPress-internen Status (Plugin-Versionen, Datenbank-Health, Theme-Konflikte, geplante Aktualisierungen, .maintenance-Flags), schreibt aber NIE etwas zurück. Kein Schreibzugriff auf wp_options, keine FTP-Aktionen, keine Cron-Manipulation. Rechtlich sauber für Wartungsverträge, weil der Endkunde keine \"unkontrollierte Drittsoftware\" installiert. Ab Starter (29 €/Monat) inklusive — auf Agency Scale per One-Click-Installation auf alle Mandanten ausrollbar. Vorteil gegenüber rein externer Analyse: tiefere Diagnose ohne dass Sie Mandanten-Passwörter durch Ihre Agentur reichen müssen.",
  },
  {
    q: "Warum brauche ich das Plugin überhaupt? Reicht der externe Scan nicht?",
    a: "Für maximale Sicherheit und Tiefe gegenüber Mandanten. Ein externer Crawl sieht nur, was die Website öffentlich preisgibt — Title-Tags, sichtbare Links, Bilder. Was er NICHT sieht: PHP-Error-Logs, langsame Datenbank-Queries, Plugin-Versions-Konflikte, fehlerhafte Cron-Jobs, kompromittierte Theme-Dateien. Genau das liest unser Read-Only-Plugin aus — ohne Schreibzugriff, ohne dass Sie Mandanten-Passwörter durch Ihre Agentur reichen müssen. Auf Agency Scale läuft das Plugin unter IHREM Branding (eigenes Logo + Agentur-Domain), sodass der Endkunde es als integralen Teil Ihres Wartungsvertrags wahrnimmt. Konfiguration unter Dashboard → Agency-Branding.",
  },
  {
    q: "Wie funktioniert das Mandanten-Portal unter eigener Subdomain?",
    a: "Sie hinterlegen einmalig ein CNAME-Record in Ihrem DNS (z. B. portal.ihre-agentur.de → wf-portal.vercel.app). Wir provisionieren ein TLS-Zertifikat automatisch. Ihre Endkunden sehen dann ausschließlich Ihr Branding — kein WebsiteFix-Logo, kein Hinweis auf das Tool. Inkl. eigener SMTP-Adresse für Auto-Reports. Full White-Label heißt: Endkunde sieht Sie als Anbieter, nicht uns.",
  },
  {
    q: "Was bringt mir der 60-Sekunden-Watchdog im Vergleich zu täglichem Monitoring?",
    a: "Wenn die Website eines Endkunden um 09:14 Uhr ausfällt und Sie es um 09:16 Uhr wissen, retten Sie die Beziehung — und können den Wartungsvertrag damit rechtfertigen. Wenn Sie es um 23:00 Uhr per täglichem Cron-Job erfahren, ist die Beschwerde-Mail vom Endkunden längst da. Das ist der Unterschied zwischen Versicherungs- und Notfall-Modell.",
  },
  {
    q: "Welche Team-Rollen gibt es und wie unterscheiden sie sich?",
    a: "Drei Rollen: Admin (volle Kontrolle, Billing, Mandantenverwaltung), Editor (sieht Issues + Smart-Fix-Guides, kann fixen, KEIN Billing-Zugriff, KEINE Kundendaten), Viewer (Read-Only für Stakeholder). Damit können Sie Ihrem Junior-Team sicher Aufgaben übergeben, ohne sensible Stripe-Daten oder Kundenrabatte preiszugeben.",
  },
  {
    q: "Wie läuft die Jira / Trello / Asana / Slack-Integration?",
    a: "OAuth-Flow im Settings-Bereich, einmalig verbinden. Pro Mandant konfigurieren Sie das Ziel-Projekt + die Severity-Schwelle (z. B. \"nur kritische Issues nach Jira\"). Webhook-Trigger feuert automatisch, sobald ein neuer Befund gefunden wird — kein manuelles Copy-Paste, kein Browser-Tab-Wechsel.",
  },
  {
    q: "Wie sicher sind Mandanten-Daten — DSGVO, Haftung?",
    a: "Hosting in Frankfurt, EU-only Datenfluss, TLS-Verschlüsselung, ISO-27001-Provider. Sie erhalten einen DSGVO-konformen AVV und einen Audit-Log, der jeden Scan, jeden Fix und jede Team-Aktion protokolliert. Im Schadensfall können Sie nachweisen, dass die Wartung ordnungsgemäß erfolgt ist — wertvoll bei BFSG-2025-Streitigkeiten.",
  },
  {
    q: "Warum 249 € statt 89 €? Was ist der Hauptunterschied?",
    a: "Professional ist für Owner-Operators, die selbst fixen. Agency Scale ist für Inhaber, die NICHT mehr selbst fixen, sondern delegieren und ein Mandantengeschäft skalieren. Sie zahlen den Aufpreis für: Mandanten-Portal unter eigener Subdomain, Team-Rollen-Logik, 60-Sekunden-Watchdog, Workflow-API, DSGVO-AVV. Bei einer einzigen vermiedenen Senior-Stunde pro Monat (≈ 100 €) hat sich der Aufpreis amortisiert.",
  },
  {
    q: "Kann ich Website-Fix zur Neukundengewinnung nutzen?",
    a: "Ja — das ist sogar ein Kern-Feature des Agency-Scale-Plans. Du bekommst einen iframe-Embed-Code für deine Marketing-Site, der unseren Scanner unter DEINEM Logo + DEINER Brand-Farbe + DEINEM Agentur-Namen zeigt. Besucher geben ihre URL ein, sehen einen Teaser-Score und müssen für den Vollreport ihre Email hinterlassen. Dieser Lead landet sofort in deinem Dashboard unter \"Lead-Generator\" — du kannst ihn mit einem Klick als Mandantenprojekt anlegen. Die Übergabe vom Lead zum Wartungsvertrag wird damit zur Routine, nicht zum Zufall. Setup: 2 Minuten (Snippet kopieren, in WordPress/Webflow/Wix einfügen, fertig).",
  },
  {
    q: "Können meine Endkunden den 9,90-€-Pay-per-Fix nutzen, ohne dass ich für jeden ein Konto anlegen muss?",
    a: "Ja — und das ist ein eigener Lead-Magnet für Sie. Der Pay-per-Fix-Flow läuft komplett anonym: Endkunde scannt seine Seite, wählt einen Fix-Guide, gibt seine E-Mail ein, zahlt 9,90 € via Stripe — fertig. Account-Provisionierung passiert automatisch im Hintergrund nach erfolgreicher Zahlung; der Käufer bekommt eine Bestätigungs-Mail mit Passwort-setzen-Link. Wenn Sie das Lead-Magnet-Widget auf Ihrer eigenen Marketing-Site einbinden, ziehen Sie Endkunden in Ihren Funnel und können sie später auf Wartungsverträge upgraden.",
  },
  {
    q: "Funktioniert WebsiteFix mit dem Hoster meiner Mandanten (Strato, IONOS, All-Inkl)?",
    a: "Ja, mit jedem Hoster, dessen Seite öffentlich erreichbar ist. Für die deutschen Top-Hoster liefern wir hoster-spezifische Optimierungs-Pfade in jedem Smart-Fix-Guide: Strato, IONOS / 1&1, All-Inkl, Hostinger und Hetzner. Heißt: Wenn Ihr Junior einen Fix-Guide öffnet, sieht er nicht nur die generische WordPress-Anleitung, sondern die exakten Klick-Pfade fürs Hoster-Backend des konkreten Mandanten (Hoster wird automatisch aus dem Scan erkannt). Bei Spezial-Hostern wie Cloudways, Kinsta oder WP Engine greift die Standard-Anleitung — wir ergänzen Hoster-Spezial-Pfade laufend nach Mandanten-Verteilung.",
  },
  {
    q: "Kann ich den Plan jederzeit kündigen?",
    a: "Ja. Monatliche Kündigung, keine Mindestlaufzeit. Abrechnung über Stripe. Nach der Kündigung haben Sie noch Zugang bis zum Ende des bezahlten Zeitraums.",
  },
];

// ─── Theme-Tokens (lokal, damit die Page eigenständig bleibt) ───────────────
const T = {
  card:        "rgba(255,255,255,0.03)",
  cardHover:   "rgba(255,255,255,0.05)",
  border:      "rgba(255,255,255,0.08)",
  borderStrong:"rgba(255,255,255,0.14)",
  text:        "#fff",
  textSub:     "rgba(255,255,255,0.65)",
  textMuted:   "rgba(255,255,255,0.42)",
  textFaint:   "rgba(255,255,255,0.28)",
  scale:       "#A78BFA",
  scaleBg:     "rgba(167,139,250,0.10)",
  scaleBorder: "rgba(167,139,250,0.32)",
  pro:         "#10B981",
  proBg:       "rgba(16,185,129,0.10)",
  proBorder:   "rgba(16,185,129,0.30)",
  amber:       "#FBBF24",
  amberBg:     "rgba(251,191,36,0.08)",
  amberBorder: "rgba(251,191,36,0.30)",
  red:         "#F87171",
  redBg:       "rgba(248,113,113,0.06)",
  redBorder:   "rgba(248,113,113,0.25)",
  green:       "#22C55E",
} as const;

export default function AgencyPage() {
  // Experten-Logbuch-Teaser — jüngster Post mit Kategorie "agency".
  // Server-side beim Build evaluiert (fs liest content/blog/*.md).
  // Bei null (kein Agency-Post vorhanden) blendet sich die Sektion
  // einfach aus — kein leerer Card-Slot.
  const latestAgencyPost = getLatestAgencyPost();

  return (
    <>
      {/* AutoCheckout fängt ?checkout=<plan>-Param vom Google-OAuth-Rückweg ab */}
      <Suspense fallback={null}><AutoCheckout /></Suspense>

      {/* Soft-Launch-Hinweis bis Stripe-Live + Resend-Verify komplett sind */}
      <MaintenanceBanner />

      {/* Stripe-Cancel-Banner: rendert nur bei ?checkout=cancelled. Suspense
          required wegen useSearchParams im Client-Component. */}
      <Suspense fallback={null}><CancelBanner /></Suspense>

      {/* ─── NAV ──────────────────────────────────────────────────────────── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(11,12,16,0.95)", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <BrandLogo />
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            <div className="hide-sm" style={{ display: "flex", gap: 26 }}>
              <Link href="/"               style={{ fontSize: 14, color: T.textSub, textDecoration: "none" }}>Home</Link>
              <Link href="/fuer-agenturen" style={{ fontSize: 14, color: T.text, textDecoration: "none", fontWeight: 600 }}>Für Agenturen</Link>
              <Link href="/blog"           style={{ fontSize: 14, color: T.textSub, textDecoration: "none" }}>Blog</Link>
              <Link href="#pricing"        style={{ fontSize: 14, color: T.textSub, textDecoration: "none" }}>Preise</Link>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Link href="/login" className="hide-sm" style={{
                fontSize: 13, padding: "7px 16px", borderRadius: 8,
                border: `1px solid ${T.border}`, color: T.textSub, textDecoration: "none",
              }}>Login</Link>
              <Link href="#pricing" className="hide-sm" style={{
                fontSize: 13, padding: "8px 18px", borderRadius: 8,
                background: "linear-gradient(90deg,#7C3AED,#A78BFA)", color: "#fff",
                textDecoration: "none", fontWeight: 700,
                boxShadow: "0 4px 14px rgba(167,139,250,0.32)",
              }}>Marge skalieren →</Link>
              <MobileNav />
            </div>
          </div>
        </div>
      </nav>

      {/* Kein eigener Background auf <main> — erbt body-Background (#0b0c10
          aus globals.css) wie die Homepage. Sonst wirkt /fuer-agenturen
          dunkler als / und der Tab-Wechsel zwischen den Seiten flickert. */}
      <main style={{ color: T.text }}>

        {/* ─── HERO ────────────────────────────────────────────────────────── */}
        <section style={{
          maxWidth: 1180, margin: "0 auto", padding: "88px 24px 72px",
          textAlign: "center", position: "relative",
        }}>
          {/* Hintergrund-Glow */}
          <div aria-hidden="true" style={{
            position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
            width: "min(100%, 900px)", height: 480, pointerEvents: "none",
            background: "radial-gradient(ellipse at center, rgba(124,58,237,0.18) 0%, transparent 70%)",
            zIndex: 0,
          }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "6px 16px", borderRadius: 999, marginBottom: 22,
              background: T.scaleBg, border: `1px solid ${T.scaleBorder}`,
            }}>
              <Crown size={14} color={T.scale} strokeWidth={2.2} />
              <span style={{ fontSize: 11.5, fontWeight: 800, color: T.scale, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Für Agentur-Inhaber, nicht für Tool-Sammler
              </span>
            </div>
            <h1 style={{
              margin: "0 0 22px",
              fontSize: "clamp(34px, 5vw, 64px)",
              fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.04em",
              maxWidth: 920, marginInline: "auto",
            }}>
              Vom Notfall-Fixer<br/>
              zum{" "}
              <span style={{
                background: "linear-gradient(90deg,#A78BFA,#FBBF24)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>Profit-Center</span>.
            </h1>
            <p style={{
              margin: "0 auto 36px", fontSize: "clamp(15px, 1.6vw, 19px)",
              color: T.textSub, lineHeight: 1.65, maxWidth: 680,
            }}>
              Hören Sie auf, Senior-Stunden für Alt-Texte zu verbrennen. Mit unseren
              Smart-Fix-Guides erledigt ein Werkstudent Aufgaben, für die Sie bisher
              <strong style={{ color: T.text, fontWeight: 700 }}> 100 €/h Senior-Lohn</strong> abgerechnet haben.
              Sie behalten die Marge — Ihre Senior-Devs arbeiten an dem, was wirklich Geld bringt.
            </p>

            {/* Primary CTA */}
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 18 }}>
              <CheckoutButton
                plan="agency"
                label="Agentur-Marge jetzt skalieren →"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "14px 30px", borderRadius: 12,
                  background: "linear-gradient(90deg,#7C3AED,#A78BFA)",
                  color: "#fff", fontSize: 15, fontWeight: 800,
                  textDecoration: "none", border: "none", cursor: "pointer",
                  boxShadow: "0 6px 22px rgba(124,58,237,0.45)",
                }}
              />
              <Link href="#pricing" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "14px 26px", borderRadius: 12,
                background: T.card, border: `1px solid ${T.borderStrong}`,
                color: T.text, fontSize: 14, fontWeight: 700, textDecoration: "none",
              }}>
                Pro vs. Scale vergleichen
              </Link>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: T.textFaint }}>
              Monatlich kündbar · DSGVO-AVV · Hosting in Frankfurt · Onboarding-Call inklusive
            </p>

            {/* AgencyStats — bestehende Komponente, zeigt Live-Use-Cases */}
            <div style={{ marginTop: 56 }}>
              <AgencyStats />
            </div>
          </div>
        </section>

        {/* ─── INTERAKTIVER VERGLEICH (Tab-Toggle) ─────────────────────────────
            Standard-Scanner vs. WebsiteFix Agency — direkter Tab-Switcher
            mit Werte-Toggle in der Tabelle. Conversion-Hebel: macht den
            Mehrwert sofort sichtbar bevor der User zur Pricing-Sektion scrollt. */}
        <ComparisonToggle />

        {/* ─── LOHNKOSTEN-HEBEL ────────────────────────────────────────────── */}
        {/* Direkter €-Vergleich Senior vs. Junior — der wichtigste psychologische
            Hook für Inhaber. Konservative Annahmen (1 h/Issue), damit der
            Vergleich nicht wie Marketing-Sales-Math wirkt. */}
        <section>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px" }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 800, color: T.amber, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Lohnkosten-Hebel
              </p>
              <h2 style={{ margin: "0 0 14px", fontSize: "clamp(26px, 3.5vw, 42px)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.15 }}>
                Senior-Stunden, die niemand mehr abrechnen sollte
              </h2>
              <p style={{ margin: 0, maxWidth: 640, marginInline: "auto", fontSize: 15, color: T.textSub, lineHeight: 1.65 }}>
                Drei Aufgaben, die Sie aktuell vermutlich mit Senior-Stundensatz in
                Rechnung stellen — und wie viel Marge dabei verschenkt wird.
              </p>
            </div>

            {/* 3 Karten: alt-texts / form-labels / 404-links */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18, marginBottom: 36 }}>
              {[
                {
                  icon: AlertTriangle,
                  task: "24 Bilder ohne Alt-Text setzen",
                  seniorTime: "≈ 60–90 Min Senior-Dev",
                  seniorCost: 120,
                  juniorCost: 35,
                  fixVia: "Smart-Fix-Drawer → WP-Medien-Manager",
                },
                {
                  icon: FileText,
                  task: "Formular-Labels & ARIA-Attribute korrigieren",
                  seniorTime: "≈ 45–75 Min Senior-Dev",
                  seniorCost: 100,
                  juniorCost: 30,
                  fixVia: "Smart-Fix-Drawer → Builder-Modul-Settings",
                },
                {
                  icon: Server,
                  task: "404-Links lokalisieren & ersetzen",
                  seniorTime: "≈ 60–120 Min Senior-Dev",
                  seniorCost: 130,
                  juniorCost: 40,
                  fixVia: "Smart-Fix-Drawer → Editor-Suchen-Ersetzen",
                },
              ].map(item => {
                const Icon = item.icon;
                const saved = item.seniorCost - item.juniorCost;
                return (
                  <div key={item.task} style={{
                    background: T.card, border: `1px solid ${T.border}`,
                    borderRadius: 16, padding: "22px 22px",
                    display: "flex", flexDirection: "column",
                  }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10, marginBottom: 14,
                      background: T.amberBg, border: `1px solid ${T.amberBorder}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon size={18} color={T.amber} strokeWidth={2} />
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 6, letterSpacing: "-0.01em" }}>
                      {item.task}
                    </div>
                    <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 16 }}>
                      {item.seniorTime}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                        <span style={{ color: T.red }}>Senior heute:</span>
                        <strong style={{ color: T.red, fontWeight: 700 }}>{item.seniorCost} €</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                        <span style={{ color: T.green }}>Junior mit Guide:</span>
                        <strong style={{ color: T.green, fontWeight: 700 }}>{item.juniorCost} €</strong>
                      </div>
                      <div style={{ height: 1, background: T.border, margin: "4px 0" }} />
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                        <span style={{ color: T.textSub }}>Marge-Plus:</span>
                        <strong style={{ color: T.amber, fontWeight: 800 }}>+ {saved} €</strong>
                      </div>
                    </div>

                    <div style={{
                      padding: "8px 12px", borderRadius: 8,
                      background: "rgba(0,0,0,0.25)", border: `1px solid ${T.border}`,
                      fontSize: 11, color: T.textMuted,
                    }}>
                      Fix via: <strong style={{ color: T.textSub }}>{item.fixVia}</strong>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Aggregierte Bottom-Aussage */}
            <div style={{
              padding: "24px 28px", borderRadius: 16,
              background: `linear-gradient(135deg, ${T.amberBg}, ${T.scaleBg})`,
              border: `1px solid ${T.amberBorder}`,
              display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap",
            }}>
              <Wallet size={36} color={T.amber} strokeWidth={1.8} style={{ flexShrink: 0 }} />
              <div style={{ flex: "1 1 280px", minWidth: 0 }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: T.text, letterSpacing: "-0.01em", marginBottom: 4 }}>
                  Bei 50 Mandanten und 3 Junior-lösbaren Issues pro Monat …
                </div>
                <div style={{ fontSize: 14, color: T.textSub, lineHeight: 1.6 }}>
                  … sparen Sie ca. <strong style={{ color: T.amber, fontWeight: 700 }}>9.750 €</strong> monatlich an
                  Senior-Lohnkosten. Agency Scale kostet <strong style={{ color: T.text }}>249 €</strong>.
                  Die Investition amortisiert sich rechnerisch nach <strong style={{ color: T.text }}>weniger als einer Senior-Stunde</strong>.
                </div>
              </div>
              <Link href="#pricing" style={{
                flexShrink: 0,
                padding: "11px 22px", borderRadius: 10,
                background: T.amber, color: "#1a1300",
                fontSize: 13, fontWeight: 800, textDecoration: "none",
              }}>
                Plan-Vergleich →
              </Link>
            </div>
          </div>
        </section>

        {/* ─── VOM NOTFALL-MODUS ZUM VERSICHERUNGS-MODELL ──────────────────── */}
        {/* Strategie-Sektion: re-frames das Geschäftsmodell der Agentur. Wir
            verkaufen NICHT nur ein Tool — wir verkaufen die Möglichkeit, die
            eigenen Wartungsverträge teurer und nachhaltiger zu machen. */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "96px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 56, maxWidth: 720, marginInline: "auto" }}>
            <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 800, color: T.scale, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Geschäftsmodell-Upgrade
            </p>
            <h2 style={{ margin: "0 0 16px", fontSize: "clamp(26px, 3.5vw, 42px)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.15 }}>
              Vom Notfall-Modus zum Versicherungs-Modell
            </h2>
            <p style={{ margin: 0, fontSize: 15, color: T.textSub, lineHeight: 1.7 }}>
              Wartungsverträge bei Endkunden durchdrücken? Funktioniert nur, wenn Sie
              dokumentiert proaktiv arbeiten. Mit website-fix.com werden Sie vom
              reaktiven Feuerwehrmann zum strategischen Risiko-Manager.
            </p>
          </div>

          {/* Vorher/Nachher-Vergleich */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, marginBottom: 56 }}>
            {/* Vorher */}
            <div style={{
              padding: "28px 26px", borderRadius: 18,
              background: T.redBg, border: `1px solid ${T.redBorder}`,
            }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "4px 12px", borderRadius: 999, background: "rgba(248,113,113,0.12)", border: `1px solid ${T.redBorder}`, marginBottom: 16 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: T.red, letterSpacing: "0.1em", textTransform: "uppercase" }}>Vorher · Notfall-Modus</span>
              </div>
              <h3 style={{ margin: "0 0 14px", fontSize: 19, fontWeight: 800, color: T.text, letterSpacing: "-0.02em" }}>
                Sie werden angerufen, wenn’s brennt
              </h3>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  "Endkunde meldet Ausfall, Sie reagieren reaktiv",
                  "Wartungspauschale fühlt sich \"nicht wert\" an",
                  "Senior-Stunden brennen für Trivial-Aufgaben",
                  "Bei Datenpannen keine Dokumentation der Sorgfalt",
                  "Junior-Devs sind blockiert, Senior ausgelastet",
                ].map(t => (
                  <li key={t} style={{ display: "flex", gap: 9, fontSize: 13.5, color: T.textSub, lineHeight: 1.55 }}>
                    <span style={{ color: T.red, flexShrink: 0, fontWeight: 800 }}>✕</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            {/* Nachher */}
            <div style={{
              padding: "28px 26px", borderRadius: 18,
              background: T.scaleBg, border: `1px solid ${T.scaleBorder}`,
              boxShadow: "0 0 36px rgba(124,58,237,0.12)",
            }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "4px 12px", borderRadius: 999, background: "rgba(167,139,250,0.18)", border: `1px solid ${T.scaleBorder}`, marginBottom: 16 }}>
                <ShieldCheck size={12} color={T.scale} strokeWidth={2.4} />
                <span style={{ fontSize: 10, fontWeight: 800, color: T.scale, letterSpacing: "0.1em", textTransform: "uppercase" }}>Mit Agency Scale · Versicherungs-Modell</span>
              </div>
              <h3 style={{ margin: "0 0 14px", fontSize: 19, fontWeight: 800, color: T.text, letterSpacing: "-0.02em" }}>
                Sie verkaufen Sicherheit — und werden dafür bezahlt
              </h3>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  "60-Sekunden-Watchdog meldet Ausfall, bevor der Kunde es merkt",
                  "Wartungspauschale wird mit Audit-Log belegt",
                  "Junior löst 60–75 % aller Befunde via Smart-Fix-Drawer",
                  "BFSG-2025-Konformität dokumentiert — Haftungsschutz",
                  "Wartungsverträge können 2–3× teurer angeboten werden",
                ].map(t => (
                  <li key={t} style={{ display: "flex", gap: 9, fontSize: 13.5, color: T.textSub, lineHeight: 1.55 }}>
                    <Check size={14} color={T.scale} strokeWidth={3} style={{ flexShrink: 0, marginTop: 3 }} />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 3 Säulen: Haftungsschutz · Skalierbarkeit · Fachkräftemangel-Löser */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            {[
              {
                icon: Lock,
                title: "Haftungsschutz",
                desc: "BFSG 2025, DSGVO, Cookie-Compliance: jeder Scan, jeder Fix, jede Team-Aktion wird im Audit-Log protokolliert. Im Streitfall haben Sie den lückenlosen Beleg, dass die Wartung ordnungsgemäß erfolgt ist.",
                accent: "#7C3AED",
              },
              {
                icon: Layers,
                title: "Skalierbarkeit",
                desc: "Mandanten-Portal unter Ihrer Subdomain, automatische Berichte, Workflow-API zu Jira/Asana/Trello. Sie wachsen von 10 auf 50 Mandanten, ohne ein einziges neues Senior-FTE einzustellen.",
                accent: "#A78BFA",
              },
              {
                icon: Users,
                title: "Fachkräftemangel-Löser",
                desc: "Smart-Fix-Guides ermöglichen es Werkstudenten, Quereinsteigern und Junior-Devs, Aufgaben sofort zu lösen — ohne Senior-Pairing. Das beste Onboarding-Tool, das Ihre Agentur kaufen kann.",
                accent: "#10B981",
              },
            ].map(p => {
              const Icon = p.icon;
              return (
                <div key={p.title} style={{
                  padding: "26px 24px", borderRadius: 16,
                  background: T.card, border: `1px solid ${T.border}`,
                  display: "flex", flexDirection: "column",
                }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 11, marginBottom: 14,
                    background: `${p.accent}1c`, border: `1px solid ${p.accent}40`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon size={20} color={p.accent} strokeWidth={2} />
                  </div>
                  <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 800, color: T.text, letterSpacing: "-0.01em" }}>{p.title}</h3>
                  <p style={{ margin: 0, fontSize: 13.5, color: T.textSub, lineHeight: 1.65 }}>{p.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── DELEGATIONS-DASHBOARD MOCKUP ────────────────────────────────── */}
        {/* Beweis-Sektion: zeigt, wie der "Aha-Moment" im Dashboard aussieht.
            Das Mockup spiegelt das echte DelegationWidget aus AgencyDashboard. */}
        <section>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 48, alignItems: "center" }}>
              {/* Linke Spalte: Erklärtext */}
              <div>
                <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 800, color: T.green, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Im Dashboard sichtbar
                </p>
                <h2 style={{ margin: "0 0 16px", fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.18 }}>
                  Ihr Lohnkosten-Hebel — täglich aktualisiert
                </h2>
                <p style={{ margin: "0 0 18px", fontSize: 14.5, color: T.textSub, lineHeight: 1.7 }}>
                  Direkt nach dem Login sehen Sie, wie viele offene Befunde gerade
                  durch Junior-Delegation lösbar sind und wie viel Senior-Lohnkosten
                  Sie damit diesen Monat einsparen können. <strong style={{ color: T.text, fontWeight: 700 }}>Konservative Schätzung</strong> — wir
                  rechnen nur Issues mit, die zweifelsfrei im WP-Backend lösbar sind.
                </p>
                <ul style={{ margin: "0 0 24px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    "Klassifizierung pro Issue: Junior · Senior · gemischt",
                    "Ersparnis-Rechner mit Stundensatz-Annahmen (anpassbar)",
                    "Direkter Link in die Team-Verwaltung mit Rollen-Setup",
                    "Aggregation über alle Mandanten — keine Einzel-Klicks nötig",
                  ].map(t => (
                    <li key={t} style={{ display: "flex", gap: 9, fontSize: 13.5, color: T.textSub, lineHeight: 1.55 }}>
                      <Check size={14} color={T.green} strokeWidth={3} style={{ flexShrink: 0, marginTop: 3 }} />
                      {t}
                    </li>
                  ))}
                </ul>
                <CheckoutButton
                  plan="agency"
                  label="Agentur-Marge jetzt skalieren →"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "12px 24px", borderRadius: 10,
                    background: "linear-gradient(90deg,#7C3AED,#A78BFA)",
                    color: "#fff", fontSize: 14, fontWeight: 800,
                    border: "none", cursor: "pointer",
                    boxShadow: "0 4px 16px rgba(124,58,237,0.35)",
                  }}
                />
              </div>

              {/* Rechte Spalte: Mockup */}
              <div style={{
                background: `linear-gradient(135deg, ${T.scaleBg}, rgba(251,191,36,0.04))`,
                border: `1px solid ${T.scaleBorder}`,
                borderRadius: 16, padding: "22px 24px",
                boxShadow: "0 12px 50px rgba(124,58,237,0.18)",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 18, flexWrap: "wrap", marginBottom: 18 }}>
                  <div style={{ minWidth: 0, flex: "1 1 200px" }}>
                    <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 800, color: T.scale, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                      Delegations-Hebel
                    </p>
                    <h4 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 800, color: T.text, letterSpacing: "-0.02em" }}>
                      Was dein Junior heute übernehmen kann
                    </h4>
                  </div>
                  <div style={{
                    flexShrink: 0, background: T.amberBg,
                    border: `1px solid ${T.amberBorder}`, borderRadius: 12,
                    padding: "10px 16px",
                  }}>
                    <div style={{ fontSize: 9, fontWeight: 800, color: T.amber, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 3 }}>
                      Ersparnis · Monat
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: T.amber, letterSpacing: "-0.03em", lineHeight: 1 }}>
                      ≈ 1.170 €
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 14 }}>
                  <div style={{ padding: "10px 12px", borderRadius: 9, background: "rgba(0,0,0,0.25)", border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>27</div>
                    <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>Issues offen</div>
                  </div>
                  <div style={{ padding: "10px 12px", borderRadius: 9, background: "rgba(74,222,128,0.06)", border: `1px solid rgba(74,222,128,0.22)` }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: T.green }}>18 · 67 %</div>
                    <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>Junior-lösbar</div>
                  </div>
                  <div style={{ padding: "10px 12px", borderRadius: 9, background: T.redBg, border: `1px solid ${T.redBorder}` }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: T.red }}>9</div>
                    <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>Senior nötig</div>
                  </div>
                </div>

                <div aria-hidden="true" style={{ height: 6, borderRadius: 4, background: "rgba(248,113,113,0.18)", overflow: "hidden", marginBottom: 14 }}>
                  <div style={{ width: "67%", height: "100%", background: "linear-gradient(90deg,#4ade80,#22c55e)" }} />
                </div>

                <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.5 }}>
                  Annahme: 100 €/h Senior · 35 €/h Junior · 1 h pro Fix. Konservativ
                  klassifiziert — nur Issues, die ohne Code-Zugang im Backend lösbar sind.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── WHITE-LABEL MANDANTEN-PORTAL ────────────────────────────────── */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "96px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 48, maxWidth: 720, marginInline: "auto" }}>
            <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 800, color: T.scale, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              White-Label · Mandanten-Portal
            </p>
            <h2 style={{ margin: "0 0 16px", fontSize: "clamp(26px, 3.5vw, 42px)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.15 }}>
              Ihre Marke, Ihre Domain, Ihre Endkunden
            </h2>
            <p style={{ margin: 0, fontSize: 15, color: T.textSub, lineHeight: 1.7 }}>
              Das gesamte Kunden-Portal läuft unter <strong style={{ color: T.text, fontWeight: 700 }}>portal.ihre-agentur.de</strong>.
              Ihr Endkunde sieht weder den Namen WebsiteFix noch unser Logo. Er sieht nur Sie.
            </p>
          </div>

          <div style={{
            background: T.card, border: `1px solid ${T.border}`,
            borderRadius: 18, padding: "32px 30px",
            marginBottom: 28,
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
              {[
                { icon: Globe,       title: "Eigene Subdomain",       desc: "CNAME-Setup, automatisches TLS-Cert, beliebig viele Mandanten-Tenants." },
                { icon: Palette,     title: "Branding & SVG-Logo",    desc: "Farbe, Typo, SVG-Logo. Live-Preview vor Aktivierung — kein Trial-and-Error." },
                { icon: BellDot,     title: "SMTP unter Ihrer Domain", desc: "Auto-Reports gehen an Endkunden mit Ihrer Absender-Adresse — nicht von uns." },
                { icon: FileText,    title: "PDF mit Ihrem Layout",   desc: "Executive-Summary + Befunde, vollständig white-labeled. Ein Klick zum Kunden." },
                { icon: ShieldCheck, title: "DSGVO-AVV inklusive",    desc: "Auftragsverarbeitungs-Vertrag im Account-Bereich — ein PDF, einmal unterschreiben." },
                { icon: Magnet,      title: "Lead-Magnet-Widget",     desc: "Embed-Snippet auf Ihrer Marketing-Site — Neukunden machen Self-Service-Scan." },
              ].map(f => {
                const Icon = f.icon;
                return (
                  <div key={f.title} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                      background: T.scaleBg, border: `1px solid ${T.scaleBorder}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon size={18} color={T.scale} strokeWidth={2} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h4 style={{ margin: "0 0 4px", fontSize: 14.5, fontWeight: 800, color: T.text, letterSpacing: "-0.01em" }}>{f.title}</h4>
                      <p style={{ margin: 0, fontSize: 13, color: T.textSub, lineHeight: 1.55 }}>{f.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <p style={{ margin: 0, textAlign: "center", fontSize: 12.5, color: T.textFaint }}>
            White-Label-Preview im Dashboard: Logo hochladen, sofort sehen, was Ihr Endkunde sehen wird. <em style={{ color: T.textMuted }}>Beta — Live-Preview-UI im Q3-Release.</em>
          </p>
        </section>

        {/* ─── WORKFLOW-INTEGRATION ────────────────────────────────────────── */}
        <section>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px" }}>
            <div style={{ textAlign: "center", marginBottom: 48, maxWidth: 720, marginInline: "auto" }}>
              <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 800, color: T.scale, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Workflow-Integration
              </p>
              <h2 style={{ margin: "0 0 16px", fontSize: "clamp(26px, 3.5vw, 42px)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.15 }}>
                Befunde fließen in Ihren Workflow — automatisch
              </h2>
              <p style={{ margin: 0, fontSize: 15, color: T.textSub, lineHeight: 1.7 }}>
                Kein „Ich logge mich gleich ins Tool ein"-Tab-Wechsel. Sobald die Engine
                ein Issue findet, landet es bei <strong style={{ color: T.text }}>Jira</strong>,{" "}
                <strong style={{ color: T.text }}>Asana</strong>,{" "}
                <strong style={{ color: T.text }}>Trello</strong> oder{" "}
                <strong style={{ color: T.text }}>Slack</strong> — bidirektional, mit
                Severity-Filter und richtigem Verantwortlichen.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
              {WORKFLOW_INTEGRATIONS.map(w => {
                const Icon = w.Icon;
                return (
                  <div key={w.name} style={{
                    padding: "20px 20px", borderRadius: 14,
                    background: T.card, border: `1px solid ${T.border}`,
                    display: "flex", flexDirection: "column", gap: 10,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {/* Brand-SVG ohne Color-Tile — Original-Brand-Farben
                          würden vom lila Backdrop verfälscht. Quadratischer
                          weißer Container für Slack/Jira/Trello/Asana. */}
                      <div style={{
                        width: 38, height: 38, borderRadius: 9,
                        background: "rgba(255,255,255,0.06)", border: `1px solid ${T.border}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                      }}>
                        <Icon size={22} />
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 800, color: T.text }}>{w.name}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12.5, color: T.textSub, lineHeight: 1.6 }}>{w.desc}</p>
                  </div>
                );
              })}
            </div>

            <div style={{
              marginTop: 28, padding: "16px 20px", borderRadius: 12,
              background: T.amberBg, border: `1px solid ${T.amberBorder}`,
              display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
            }}>
              <Bell size={20} color={T.amber} strokeWidth={2} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text, marginBottom: 2 }}>
                  60-Sekunden-Watchdog (Agency Scale)
                </div>
                <div style={{ fontSize: 12.5, color: T.textSub, lineHeight: 1.5 }}>
                  Bei einem Mandanten-Ausfall wird sofort ein Slack-Ping abgesetzt. WhatsApp- und SMS-Routing werden im nächsten Release ausgeliefert.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── LEAD-MAGNET-WIDGET (eigene Sektion, Sprint 06.05.2026) ────────
            Embeddable Scanner mit Agentur-Branding. Komplette Backend-Strecke
            existiert: /widget/[agencyId] + /api/widget/* + /dashboard/lead-
            generator. Diese Sektion verkauft das Feature den Inhabern. */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "96px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 48, maxWidth: 720, marginInline: "auto" }}>
            <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 800, color: T.scale, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Dein eigener Lead-Magnet
            </p>
            <h2 style={{ margin: "0 0 16px", fontSize: "clamp(26px, 3.5vw, 42px)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.15 }}>
              Generiere Neukunden im Schlaf
            </h2>
            <p style={{ margin: 0, fontSize: 15, color: T.textSub, lineHeight: 1.7 }}>
              Binde unseren Profi-Scanner mit deinem Logo auf deiner Agentur-Website ein.
              Besucher scannen ihre Seite — du bekommst die qualifizierten Leads im Dashboard.
              Kein „Hi, wir machen Websites"-Cold-Call mehr.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 28, alignItems: "center", marginBottom: 32 }}>

            {/* Linke Spalte: Erklärtext + Bullets */}
            <div>
              <ul style={{ margin: "0 0 24px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  { title: "Self-Service-Scan auf deiner Domain", body: "Besucher gibt URL ein, sieht in 60 Sek. einen Teaser-Score — komplett unter deinem Logo." },
                  { title: "Email = Vollreport-Trigger", body: "Für den vollständigen Bericht hinterlässt der Besucher eine Email. Dein Mandanten-Funnel ist befüllt." },
                  { title: "Lead landet sofort in deinem Dashboard", body: "Ein Klick: Lead → Mandantenprojekt. Du startest die erste Wartungs-Pitch in unter 30 Sekunden." },
                  { title: "iframe-Embed in 2 Minuten", body: "Copy-Paste eines <iframe>-Snippets. Funktioniert mit jedem CMS — WordPress, Webflow, Wix, Static." },
                ].map(b => (
                  <li key={b.title} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <Check size={16} color={T.scale} strokeWidth={3} style={{ flexShrink: 0, marginTop: 3 }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 2 }}>{b.title}</div>
                      <div style={{ fontSize: 13, color: T.textSub, lineHeight: 1.55 }}>{b.body}</div>
                    </div>
                  </li>
                ))}
              </ul>
              <CheckoutButton
                plan="agency"
                label="Agency Scale starten →"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "12px 24px", borderRadius: 10,
                  background: "linear-gradient(90deg,#7C3AED,#A78BFA)",
                  color: "#fff", fontSize: 14, fontWeight: 800,
                  border: "none", cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(124,58,237,0.32)",
                }}
              />
            </div>

            {/* Rechte Spalte: Widget-Mockup */}
            <div style={{
              padding: "26px 24px", borderRadius: 16,
              background: T.card, border: `1px solid ${T.border}`,
              boxShadow: "0 12px 50px rgba(124,58,237,0.10)",
            }}>
              {/* Browser-Frame */}
              <div style={{
                background: "rgba(0,0,0,0.30)",
                border: `1px solid ${T.border}`,
                borderRadius: 10,
                overflow: "hidden",
              }}>
                <div style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: 6, borderBottom: `1px solid ${T.border}`, background: "rgba(255,255,255,0.02)" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.20)" }} />
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.20)" }} />
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.20)" }} />
                  <span style={{ marginLeft: 12, fontSize: 11, color: T.textMuted, fontFamily: "monospace" }}>portal.deine-agentur.de</span>
                </div>
                <div style={{ padding: "26px 22px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 14 }}>
                  {/* Logo-Placeholder */}
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: "linear-gradient(135deg,#7C3AED,#A78BFA)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em",
                  }}>
                    A
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 4 }}>
                      Kostenloser Website-Check
                    </div>
                    <div style={{ fontSize: 11, color: T.textMuted }}>
                      powered by Deine Agentur
                    </div>
                  </div>
                  <div style={{
                    width: "100%", padding: "10px 12px", borderRadius: 8,
                    background: "rgba(0,0,0,0.40)", border: `1px solid ${T.border}`,
                    fontSize: 12, color: T.textFaint, fontFamily: "monospace", textAlign: "left",
                  }}>
                    https://kunde-website.de
                  </div>
                  <button type="button" disabled aria-disabled="true" style={{
                    width: "100%", padding: "9px 16px", borderRadius: 8,
                    background: "linear-gradient(90deg,#7C3AED,#A78BFA)",
                    color: "#fff", fontSize: 13, fontWeight: 800,
                    border: "none", cursor: "not-allowed",
                    boxShadow: "0 3px 12px rgba(124,58,237,0.30)",
                  }}>
                    Jetzt kostenlos prüfen →
                  </button>
                </div>
              </div>

              {/* Embed-Code-Hint */}
              <div style={{ marginTop: 14, padding: "10px 12px", borderRadius: 7, background: "rgba(0,0,0,0.30)", border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>
                  Embed-Code (im Dashboard)
                </div>
                <code style={{ fontSize: 11, color: T.textSub, fontFamily: "monospace", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  &lt;iframe src=&quot;.../widget/[deine-id]&quot; ...&gt;
                </code>
              </div>
            </div>

          </div>
        </section>

        {/* ─── TEAM-ROLLEN ─────────────────────────────────────────────────── */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "96px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 48, maxWidth: 720, marginInline: "auto" }}>
            <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 800, color: T.scale, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Team-Rollen
            </p>
            <h2 style={{ margin: "0 0 16px", fontSize: "clamp(26px, 3.5vw, 42px)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.15 }}>
              Delegieren ohne Risiko
            </h2>
            <p style={{ margin: 0, fontSize: 15, color: T.textSub, lineHeight: 1.7 }}>
              Drei Rollen, granulare Rechte — Junior-Devs sehen nur, was sie sollen.
              Billing, Stripe-Daten und Mandantenverträge bleiben beim Inhaber.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            {[
              {
                role: "Admin",
                accent: T.scale,
                accentBg: T.scaleBg,
                accentBorder: T.scaleBorder,
                desc: "Inhaber-Rolle. Volle Kontrolle: Billing, Mandanten, Team-Einladungen, Branding.",
                bullets: ["Stripe-Verwaltung", "Mandanten-Anlegen / Löschen", "Branding + Subdomain", "Team-Einladungen", "Audit-Log-Einsicht"],
              },
              {
                role: "Editor",
                accent: T.green,
                accentBg: "rgba(34,197,94,0.08)",
                accentBorder: "rgba(34,197,94,0.30)",
                desc: "Junior-Rolle. Sieht Issues + Smart-Fix-Guides, kann fixen, Status setzen.",
                bullets: ["Issue-Liste pro Mandant", "Smart-Fix-Drawer + KI-Vorschläge", "Fix-Status setzen", "Kein Billing-Zugriff", "Keine Mandantendaten"],
              },
              {
                role: "Viewer",
                accent: "#60a5fa",
                accentBg: "rgba(96,165,250,0.08)",
                accentBorder: "rgba(96,165,250,0.30)",
                desc: "Read-Only-Rolle für Stakeholder, Kunden-Manager oder externe Reviewer.",
                bullets: ["Score-Übersicht pro Mandant", "Berichts-Archiv lesen", "Keine Aktionen", "Keine Daten-Edits", "Optional: Export-Erlaubnis"],
              },
            ].map(r => (
              <div key={r.role} style={{
                padding: "24px 22px", borderRadius: 16,
                background: r.accentBg, border: `1px solid ${r.accentBorder}`,
              }}>
                <h3 style={{ margin: "0 0 10px", fontSize: 17, fontWeight: 800, color: r.accent, letterSpacing: "-0.01em" }}>{r.role}</h3>
                <p style={{ margin: "0 0 14px", fontSize: 13, color: T.textSub, lineHeight: 1.55 }}>{r.desc}</p>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                  {r.bullets.map(b => (
                    <li key={b} style={{ display: "flex", gap: 8, fontSize: 12.5, color: T.textMuted, lineHeight: 1.5 }}>
                      <Check size={12} color={r.accent} strokeWidth={3} style={{ flexShrink: 0, marginTop: 4 }} />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p style={{ margin: "24px auto 0", maxWidth: 700, textAlign: "center", fontSize: 12.5, color: T.textFaint, lineHeight: 1.6 }}>
            Roll-Out-Roadmap: Schema + Invite-Flow live. Granulare Route-Enforcement für jede API derzeit im Audit. Zwischenzeitlich harte Trennung: Editor-/Viewer-Accounts können sich anmelden und sehen die ihnen zugewiesenen Mandanten.
          </p>
        </section>

        {/* ─── ROI-CALCULATOR ──────────────────────────────────────────────── */}
        <section>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 24px" }}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 800, color: T.amber, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                ROI-Rechner
              </p>
              <h2 style={{ margin: 0, fontSize: "clamp(22px, 2.8vw, 32px)", fontWeight: 800, letterSpacing: "-0.025em" }}>
                Was bringt Ihnen Agency Scale konkret?
              </h2>
            </div>
            <RoiCalculator />
          </div>
        </section>

        {/* ─── PRICING ─────────────────────────────────────────────────────── */}
        <section id="pricing" style={{ padding: "96px 24px" }}>
          <div style={{ maxWidth: 1180, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 32, maxWidth: 720, marginInline: "auto" }}>
              <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 800, color: T.scale, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Plan-Vergleich
              </p>
              <h2 style={{ margin: "0 0 16px", fontSize: "clamp(26px, 3.5vw, 42px)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.15 }}>
                Welche Rolle spielen Sie in Ihrer Agentur?
              </h2>
              <p style={{ margin: 0, fontSize: 15, color: T.textSub, lineHeight: 1.7 }}>
                Starte mit einem Einzel-Fix oder wähle eine Flatrate für dauerhafte Sicherheit.
                Pro = Selbst-Macher, Scale = Inhaber, der delegiert und skaliert.
              </p>
            </div>

            {/* ─── PAY-PER-FIX HIGHLIGHT-BANNER ──────────────────────────────
                Vorgelagertes Notfall-Angebot oberhalb der 3 Abo-Cards. KEEP
                SYNCED with der Banner-Variante auf src/app/page.tsx. */}
            <div style={{
              maxWidth: 920, margin: "0 auto 36px",
              padding: "20px 28px", borderRadius: 16,
              background: "linear-gradient(135deg, rgba(251,191,36,0.10), rgba(245,158,11,0.05))",
              border: `1px solid ${T.amberBorder}`,
              boxShadow: "0 0 36px rgba(251,191,36,0.08)",
              display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap",
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                background: "rgba(251,191,36,0.16)", border: `1px solid ${T.amberBorder}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }} aria-hidden="true">
                <Zap size={22} color={T.amber} strokeWidth={2.4} />
              </div>
              <div style={{ flex: "1 1 280px", minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: T.amber, letterSpacing: "0.08em", textTransform: "uppercase", padding: "2px 8px", background: T.amberBg, border: `1px solid ${T.amberBorder}`, borderRadius: 999 }}>
                    ⚡ Notfall · ohne Abo
                  </span>
                  <span style={{ fontSize: 17, fontWeight: 800, color: T.text, letterSpacing: "-0.01em" }}>
                    Pay-per-Fix · 9,90 € einmalig
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: T.textSub, lineHeight: 1.55 }}>
                  Für den Endkunden mit akutem Einzelproblem: anonymer Checkout, kein Konto vorab nötig,
                  lebenslanger Zugriff nach Zahlung. Perfekter Lead-Magnet für Agenturen.
                </p>
              </div>
              <Link href="/scan" style={{
                flexShrink: 0,
                padding: "12px 24px", borderRadius: 10,
                background: "linear-gradient(90deg,#F59E0B,#FBBF24)",
                color: "#1a1300", fontSize: 14, fontWeight: 800,
                textDecoration: "none", whiteSpace: "nowrap",
                boxShadow: "0 4px 16px rgba(251,191,36,0.40)",
              }}>
                Jetzt fixen →
              </Link>
            </div>

            <p style={{ margin: "0 auto 24px", maxWidth: 720, textAlign: "center", fontSize: 12.5, color: T.textFaint, lineHeight: 1.6 }}>
              Pro = Selbst-Macher mit eigenem Portfolio · Scale = Agentur-Inhaber, der delegiert und skaliert.
            </p>

            {/* Nur Professional + Agency Scale rendern. Starter ist auf der
                Agentur-Page nicht relevant — die Audience hier sind
                Owner-Operators und Agency-Chefs, nicht Solo-Selbstständige
                mit 1-2 Projekten. PLANS-Array bleibt intakt für andere
                Render-Pfade (z.B. /). */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, maxWidth: 820, marginInline: "auto" }}>
              {PLANS.filter(p => p.planKey !== "starter").map(p => {
                const isScale = p.planKey === "agency";
                return (
                  <div
                    key={p.planKey}
                    style={{
                      position: "relative",
                      background: isScale ? `linear-gradient(160deg, ${T.scaleBg}, rgba(251,191,36,0.04))` : T.card,
                      border: `1px solid ${isScale ? T.scaleBorder : T.border}`,
                      borderRadius: 18,
                      padding: "32px 26px",
                      display: "flex", flexDirection: "column",
                      boxShadow: isScale ? "0 12px 60px rgba(124,58,237,0.18)" : "none",
                    }}
                  >
                    {p.badge && (
                      <div style={{
                        position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
                        padding: "5px 16px", borderRadius: 999,
                        background: isScale
                          ? "linear-gradient(90deg,#7C3AED,#A78BFA)"
                          : "linear-gradient(90deg,#1d4ed8,#2563EB)",
                        fontSize: 10.5, fontWeight: 800, color: "#fff",
                        letterSpacing: "0.08em", textTransform: "uppercase",
                        whiteSpace: "nowrap",
                        boxShadow: isScale
                          ? "0 4px 14px rgba(124,58,237,0.40)"
                          : "0 4px 14px rgba(37,99,235,0.35)",
                      }}>
                        {p.badge}
                      </div>
                    )}

                    <div style={{ marginBottom: 14 }}>
                      <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 800, color: p.accent, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        {p.name}
                      </p>
                      <p style={{ margin: 0, fontSize: 12, color: T.textMuted }}>{p.audience}</p>
                    </div>

                    <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
                      <span style={{ fontSize: 44, fontWeight: 800, color: T.text, letterSpacing: "-0.04em" }}>{p.price} €</span>
                      <span style={{ fontSize: 14, color: T.textMuted }}>{p.per}</span>
                    </div>
                    <p style={{ margin: "0 0 22px", fontSize: 13.5, color: T.textSub, lineHeight: 1.55 }}>{p.desc}</p>

                    <ul style={{ margin: "0 0 20px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 9, flex: 1 }}>
                      {p.features.map(f => (
                        <li key={f.text} style={{
                          display: "flex", gap: 9, alignItems: "flex-start",
                          fontSize: 13, color: f.locked ? T.textFaint : T.textSub, lineHeight: 1.5,
                        }}>
                          {f.locked
                            ? <span style={{ color: T.textFaint, fontWeight: 700, marginTop: 1, flexShrink: 0 }}>✕</span>
                            : <Check size={13} color={p.accent} strokeWidth={3} style={{ marginTop: 3, flexShrink: 0 }} />}
                          <span style={{ fontWeight: f.highlight && !f.locked ? 600 : 400, color: f.highlight && !f.locked ? T.text : "inherit" }}>
                            {f.text}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {p.audienceFootnote && (
                      <div style={{
                        margin: "0 0 18px", padding: "10px 12px", borderRadius: 9,
                        background: "rgba(0,0,0,0.25)", border: `1px solid ${T.border}`,
                        fontSize: 11.5, color: T.textMuted, lineHeight: 1.55, fontStyle: "italic",
                      }}>
                        {p.audienceFootnote}
                      </div>
                    )}

                    <CheckoutButton
                      plan={p.planKey}
                      label={p.cta}
                      style={{
                        display: "block", textAlign: "center",
                        padding: "12px 22px", borderRadius: 11,
                        background: isScale
                          ? "linear-gradient(90deg,#7C3AED,#A78BFA)"
                          : p.planKey === "professional"
                            ? "linear-gradient(90deg,#059669,#10B981)"
                            : T.card,
                        color: "#fff",
                        fontSize: 13.5, fontWeight: 800,
                        textDecoration: "none",
                        border: isScale || p.planKey === "professional" ? "none" : `1px solid ${T.borderStrong}`,
                        cursor: "pointer",
                        boxShadow: isScale ? "0 6px 22px rgba(124,58,237,0.42)" :
                                    p.planKey === "professional" ? "0 4px 16px rgba(16,185,129,0.32)" : "none",
                      }}
                    />
                  </div>
                );
              })}
            </div>

            <p style={{ margin: "26px auto 0", maxWidth: 600, textAlign: "center", fontSize: 12, color: T.textFaint, lineHeight: 1.6 }}>
              Alle Pläne: monatliche Kündigung · keine Mindestlaufzeit · Stripe-Abrechnung · DSGVO-AVV. Steuern (USt) gemäß Reverse-Charge oder deutscher MwSt., je nach Land.
            </p>

            {/* ── Feature-by-Feature Tabelle Pro vs. Agency Scale ─────────────
                Macht den Unterschied der zwei Tier-Stufen explizit sichtbar
                und enthält die "Wartungs-Marge verdoppeln"-Box (9.750 € ROI). */}
            <PricingFeatureTable />
          </div>
        </section>

        {/* Read-Only-Plugin Verkaufsblock — KEEP SYNCED mit /. */}
        <PluginInfobox />

        {/* ─── EXPERTEN-LOGBUCH (Agency-Post) ────────────────────────────────
            Jüngster Blog-Post mit category="agency" — wenn keiner gefunden,
            blendet sich die ganze Sektion aus (kein leerer Card-Slot). */}
        {latestAgencyPost && (() => {
          const theme = categoryTheme(latestAgencyPost.category);
          return (
            <section>
              <div style={{ maxWidth: 920, margin: "0 auto", padding: "80px 24px" }}>
                <div style={{ textAlign: "center", marginBottom: 32, maxWidth: 720, marginInline: "auto" }}>
                  <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 800, color: T.scale, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    Experten-Logbuch
                  </p>
                  <h2 style={{ margin: "0 0 12px", fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.18 }}>
                    Frisches Fachwissen für Agentur-Inhaber
                  </h2>
                  <p style={{ margin: 0, fontSize: 14.5, color: T.textSub, lineHeight: 1.65 }}>
                    Tiefenbeitrag aus unserer Redaktion — Wartungsmodelle,
                    Haftungsthemen, Skalierungs-Patterns für Web-Agenturen.
                  </p>
                </div>

                <Link
                  href={`/blog/${latestAgencyPost.slug}`}
                  style={{
                    display: "block", textDecoration: "none", color: "inherit",
                    padding: "26px 28px", borderRadius: 16,
                    background: `linear-gradient(135deg, ${theme.bg}, ${T.scaleBg})`,
                    border: `1px solid ${theme.border}`,
                    boxShadow: "0 12px 40px rgba(124,58,237,0.10)",
                    transition: "transform 0.18s ease, box-shadow 0.18s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "4px 12px", borderRadius: 999,
                      background: theme.bg, border: `1px solid ${theme.border}`,
                      fontSize: 11, fontWeight: 800, color: theme.color,
                      letterSpacing: "0.06em", textTransform: "uppercase",
                    }}>
                      {theme.label}
                    </span>
                    <span style={{ fontSize: 11, color: T.textMuted, fontFamily: "monospace" }}>
                      {new Date(latestAgencyPost.date).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}
                    </span>
                  </div>
                  <h3 style={{ margin: "0 0 10px", fontSize: "clamp(18px, 2.2vw, 24px)", fontWeight: 800, letterSpacing: "-0.02em", color: T.text, lineHeight: 1.3 }}>
                    {latestAgencyPost.title}
                  </h3>
                  {latestAgencyPost.description && (
                    <p style={{ margin: "0 0 16px", fontSize: 13.5, color: T.textSub, lineHeight: 1.65 }}>
                      {latestAgencyPost.description}
                    </p>
                  )}
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    fontSize: 13, fontWeight: 700, color: T.scale,
                  }}>
                    Beitrag öffnen →
                  </span>
                </Link>

                <p style={{ margin: "16px auto 0", maxWidth: 600, textAlign: "center", fontSize: 12, color: T.textFaint }}>
                  Mehr Beiträge aus dem Agentur-Logbuch im{" "}
                  <Link href="/blog" style={{ color: T.scale, textDecoration: "none", fontWeight: 700 }}>
                    Blog →
                  </Link>
                </p>
              </div>
            </section>
          );
        })()}

        {/* ─── FAQ ─────────────────────────────────────────────────────────── */}
        <section>
          <div style={{ maxWidth: 820, margin: "0 auto", padding: "80px 24px" }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 800, color: T.amber, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Häufige Fragen
              </p>
              <h2 style={{ margin: 0, fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, letterSpacing: "-0.025em" }}>
                Was Inhaber wirklich wissen wollen
              </h2>
            </div>
            <FaqAccordion items={FAQ} />
          </div>
        </section>

        {/* ─── FINAL CTA ───────────────────────────────────────────────────── */}
        <section style={{
          maxWidth: 1100, margin: "0 auto", padding: "96px 24px 120px",
          textAlign: "center", position: "relative",
        }}>
          <div aria-hidden="true" style={{
            position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
            width: "min(100%, 720px)", height: 360, pointerEvents: "none",
            background: "radial-gradient(ellipse at center, rgba(124,58,237,0.16) 0%, transparent 70%)",
          }} />
          <div style={{ position: "relative" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "5px 14px", borderRadius: 999, marginBottom: 18,
              background: T.amberBg, border: `1px solid ${T.amberBorder}`,
            }}>
              <Zap size={12} color={T.amber} strokeWidth={2.4} />
              <span style={{ fontSize: 11, fontWeight: 800, color: T.amber, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Onboarding-Call inklusive · 60 Min mit Account-Manager
              </span>
            </div>
            <h2 style={{ margin: "0 0 18px", fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              Bereit, Senior-Stunden{" "}
              <span style={{
                background: "linear-gradient(90deg,#A78BFA,#FBBF24)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>nicht mehr zu verbrennen</span>?
            </h2>
            <p style={{ margin: "0 auto 28px", maxWidth: 540, fontSize: 15, color: T.textSub, lineHeight: 1.7 }}>
              Agency Scale ist gebaut für Agentur-Inhaber, die ihre Wartungsverträge teurer
              verkaufen, ihren Junior-Devs echtes Onboarding ermöglichen und ihre Senior-
              Kapazität auf das richten wollen, was wirklich Marge bringt.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 16 }}>
              <CheckoutButton
                plan="agency"
                label="Agentur-Marge jetzt skalieren →"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "16px 36px", borderRadius: 14,
                  background: "linear-gradient(90deg,#7C3AED,#A78BFA)",
                  color: "#fff", fontSize: 16, fontWeight: 800,
                  border: "none", cursor: "pointer",
                  boxShadow: "0 8px 32px rgba(124,58,237,0.50)",
                }}
              />
              <Link href="mailto:support@website-fix.com?subject=Agency%20Scale%20Onboarding-Call" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "16px 28px", borderRadius: 14,
                background: T.card, border: `1px solid ${T.borderStrong}`,
                color: T.text, fontSize: 14.5, fontWeight: 700, textDecoration: "none",
              }}>
                <Headphones size={16} strokeWidth={2} />
                Onboarding-Call anfragen
              </Link>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: T.textFaint }}>
              Monatlich kündbar · keine Mindestlaufzeit · Hosting Frankfurt · DSGVO-konform
            </p>
          </div>
        </section>

      </main>

      <SiteFooter />
    </>
  );
}
