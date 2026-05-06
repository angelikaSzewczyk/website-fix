/**
 * BrandIcons — Single Source für die offiziellen Workflow-Integration-Logos.
 *
 * Werden auf / (Workflow-Integration-Sektion) und /fuer-agenturen (Workflow-
 * API-Sektion) verwendet. Pure SVG-Components, keine Library-Abhängigkeit.
 *
 * Größe per `size`-Prop steuerbar (default 28). Farbtöne sind brand-genau
 * (Slack-Blau/Pink/Grün/Gelb, Jira-Blau-Verlauf, Trello-Blau, Asana-Rot).
 *
 * Wenn neue Integrationen hinzukommen (Linear, ClickUp, Notion etc.):
 * Component hier ergänzen + WORKFLOW_INTEGRATIONS-Array an den verwendenden
 * Stellen aktualisieren.
 */

type IconProps = { size?: number; className?: string };

export function SlackIcon({ size = 28, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 54 54" fill="none" className={className} aria-label="Slack">
      <path d="M19.7 33.3c0 2.2-1.8 4-4 4s-4-1.8-4-4 1.8-4 4-4h4v4z" fill="#E01E5A"/>
      <path d="M21.7 33.3c0-2.2 1.8-4 4-4s4 1.8 4 4v10c0 2.2-1.8 4-4 4s-4-1.8-4-4v-10z" fill="#E01E5A"/>
      <path d="M25.7 19.7c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4v4h-4z" fill="#36C5F0"/>
      <path d="M25.7 21.7c2.2 0 4 1.8 4 4s-1.8 4-4 4h-10c-2.2 0-4-1.8-4-4s1.8-4 4-4h10z" fill="#36C5F0"/>
      <path d="M39.3 25.7c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4h-4v-4z" fill="#2EB67D"/>
      <path d="M37.3 25.7c0 2.2-1.8 4-4 4s-4-1.8-4-4v-10c0-2.2 1.8-4 4-4s4 1.8 4 4v10z" fill="#2EB67D"/>
      <path d="M33.3 39.3c2.2 0 4 1.8 4 4s-1.8 4-4 4-4-1.8-4-4v-4h4z" fill="#ECB22E"/>
      <path d="M33.3 37.3c-2.2 0-4-1.8-4-4s1.8-4 4-4h10c2.2 0 4 1.8 4 4s-1.8 4-4 4h-10z" fill="#ECB22E"/>
    </svg>
  );
}

export function JiraIcon({ size = 28, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-label="Jira">
      <defs>
        <linearGradient id="jira-grad-1" x1="17.8" y1="15.4" x2="10.9" y2="22.3" gradientUnits="userSpaceOnUse">
          <stop offset=".18" stopColor="#0052cc"/>
          <stop offset="1"   stopColor="#2684ff"/>
        </linearGradient>
        <linearGradient id="jira-grad-2" x1="14.2" y1="16.6" x2="21.1" y2="9.7"  gradientUnits="userSpaceOnUse">
          <stop offset=".18" stopColor="#0052cc"/>
          <stop offset="1"   stopColor="#2684ff"/>
        </linearGradient>
      </defs>
      <path d="M15.9 2.1L2.1 15.9a1.4 1.4 0 000 2l6.1 6.1 7.7-7.7L22.7 10l-6.8-7.9z" fill="url(#jira-grad-1)"/>
      <path d="M16.1 29.9L29.9 16.1a1.4 1.4 0 000-2l-6.1-6.1-7.7 7.7-6.8 6.4 6.8 7.8z" fill="url(#jira-grad-2)"/>
    </svg>
  );
}

export function TrelloIcon({ size = 28, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-label="Trello">
      <rect width="32" height="32" rx="6" fill="#0079BF"/>
      <rect x="5"  y="5" width="9" height="19" rx="2" fill="white"/>
      <rect x="18" y="5" width="9" height="13" rx="2" fill="white"/>
    </svg>
  );
}

export function AsanaIcon({ size = 28, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-label="Asana">
      <circle cx="16" cy="10" r="6" fill="#F06A6A"/>
      <circle cx="7"  cy="22" r="6" fill="#F06A6A"/>
      <circle cx="25" cy="22" r="6" fill="#F06A6A"/>
    </svg>
  );
}
