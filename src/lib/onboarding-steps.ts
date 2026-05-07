/**
 * onboarding-steps.ts — plan-spezifische Onboarding-Schritte.
 *
 * Single Source für die Schritte, die im OnboardingChecklist auf dem
 * Dashboard angezeigt werden. Pro Plan ein Step-Set mit ID, Label, Hint,
 * Ziel-Link und einem optionalen "icon"-Token.
 *
 * Step-IDs sind plan-übergreifend eindeutig (kein "step1"-Generic),
 * damit der State auch dann korrekt bleibt, wenn ein User später
 * upgraded und plötzlich Agency-Steps sieht.
 *
 * Auto-Detection für einige Steps wird im Dashboard-Wrapper gemacht
 * (z.B. agencyLogoUrl gesetzt → "branding"-Step direkt initial completed).
 * Diese Datei kennt nur die statischen Definitionen.
 */

export type OnboardingStep = {
  /** Plan-übergreifend eindeutige ID. KEEP STABLE — wenn umbenannt, alle
   *  laufenden Onboarding-States verlieren den State für diesen Step. */
  id:        string;
  /** Sichtbarer Step-Title (max. ca. 50 Zeichen für Card-Layout). */
  label:     string;
  /** Sub-Text mit dem Why/What — eine Zeile. */
  hint:      string;
  /** Ziel-Link bei Click auf den Step. Leerer String = nicht klickbar
   *  (z.B. "kennenlernen"-Steps die nur abgehakt werden). */
  href:      string;
  /** Lucide-Icon-Name oder Emoji-Fallback. Wird in der UI als Schritt-Icon angezeigt. */
  icon:      string;
};

export type OnboardingPlanKey = "starter" | "professional" | "agency";

export const ONBOARDING_STEPS: Record<OnboardingPlanKey, {
  title:    string;     // Card-Header
  subtitle: string;     // Card-Sub
  steps:    OnboardingStep[];
}> = {
  starter: {
    title:    "Sicherheit aufbauen",
    subtitle: "Drei Schritte zu deinem ersten Deep-Scan-Ergebnis",
    steps: [
      {
        id:    "starter_plugin_install",
        label: "Read-Only Plugin installieren",
        hint:  "Sichere Verbindung ohne dein WP-Passwort. 2-Min-Setup.",
        href:  "/plugin",
        icon:  "🔒",
      },
      {
        id:    "starter_first_scan",
        label: "Ersten Deep-Scan starten",
        hint:  "Über das Plugin oder direkt per URL — du siehst alle Befunde.",
        href:  "/dashboard/scan",
        icon:  "⚡",
      },
      {
        id:    "starter_guide_tour",
        label: "Smart-Fix-Drawer kennenlernen",
        hint:  "Klick auf einen Befund öffnet die Schritt-für-Schritt-Anleitung.",
        href:  "/dashboard",
        icon:  "📖",
      },
    ],
  },

  professional: {
    title:    "Effizienz & Portfolio",
    subtitle: "Drei Schritte für deinen ersten Wow-Bericht",
    steps: [
      {
        id:    "pro_bulk_import",
        label: "Mehrere Projekte hinzufügen",
        hint:  "Bis zu 10 Sites parallel — jede mit eigenem Score-Verlauf.",
        href:  "/dashboard/scan",
        icon:  "📁",
      },
      {
        id:    "pro_deep_analysis",
        label: "Code-Analyse verstehen",
        hint:  "Anders als der Basis-Scan zeigt der Drawer Copy-Paste-fertige Fixes.",
        // Anker auf das DeepData-Grid im Dashboard — Browser scrollt smooth
        // dorthin und der User sieht die Plugin-only Detail-Metriken.
        href:  "/dashboard#deep-data-section",
        icon:  "🔍",
      },
      {
        id:    "pro_first_report",
        label: "Ersten White-Label PDF-Bericht erstellen",
        hint:  "Dein Logo, deine Brand-Farbe, exportierbar in 30 Sekunden.",
        href:  "/dashboard/reports",
        icon:  "📄",
      },
    ],
  },

  agency: {
    title:    "Skalierung & Branding",
    subtitle: "Drei Schritte zum vollen Profit-Center-Setup",
    steps: [
      {
        id:    "agency_branding",
        label: "White-Label aktivieren",
        hint:  "Logo hochladen + Subdomain einrichten — Endkunden sehen nur dich.",
        href:  "/dashboard/agency-branding",
        icon:  "🎨",
      },
      {
        id:    "agency_team_invite",
        label: "Erstes Team-Mitglied einladen",
        hint:  "Junior-Rolle mit Editor-Zugang — Delegations-Hebel sofort aktiv.",
        href:  "/dashboard/team",
        icon:  "👥",
      },
      {
        id:    "agency_workflow",
        label: "Workflow verbinden (Slack / Jira)",
        hint:  "60-Sek-Watchdog meldet Mandanten-Ausfälle direkt im richtigen Tool.",
        href:  "/dashboard/integrations",
        icon:  "🔗",
      },
    ],
  },
};

/** Plan-Key normalisieren — Legacy-Werte (smart-guard, agency-pro) auf canonical mappen. */
export function normalizeOnboardingPlan(plan: string | null | undefined): OnboardingPlanKey | null {
  const p = (plan ?? "").toLowerCase().trim();
  if (p === "starter")                       return "starter";
  if (p === "professional" || p === "smart-guard") return "professional";
  if (p === "agency" || p === "agency-pro" || p === "agency-starter") return "agency";
  return null;
}
