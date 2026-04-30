/**
 * builder-utils — Phase-2-Iter-3 Shared-Utilities.
 *
 * Pure-Daten/Logik ohne JSX, von BuilderIntelligenceSection,
 * WooCommerceSection und OptimizationPlanModal genutzt. Vorher in jedem
 * Variant dupliziert, jetzt zentral.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type WooAuditProp = {
  addToCartButtons:    number;
  cartButtonsBlocked:  boolean;
  pluginImpact:        Array<{ name: string; impactScore: number; reason: string }>;
  outdatedTemplates:   boolean;
  revenueRiskPct:      number;
};

export type BuilderAuditProp = {
  builder:            string | null;
  maxDomDepth:        number;
  divCount:           number;
  googleFontFamilies: string[];
  cssBloatHints:      string[];
  stylesheetCount:    number;
};

// Builder-Brand-Colors: Elementor Pink, Divi Teal, Astra Blue
export function getBuilderTheme(name: string | null) {
  switch (name) {
    case "Elementor": return { primary: "#D5336D", bg: "rgba(213,51,109,0.10)", bd: "rgba(213,51,109,0.32)", logo: "E" };
    case "Divi":      return { primary: "#00B5AD", bg: "rgba(0,181,173,0.10)",  bd: "rgba(0,181,173,0.32)",  logo: "D" };
    case "Astra":     return { primary: "#4A90E2", bg: "rgba(74,144,226,0.10)", bd: "rgba(74,144,226,0.32)", logo: "A" };
    case "WPBakery":  return { primary: "#F7781F", bg: "rgba(247,120,31,0.10)", bd: "rgba(247,120,31,0.32)", logo: "W" };
    default:          return { primary: "#94A3B8", bg: "rgba(148,163,184,0.10)",bd: "rgba(148,163,184,0.32)",logo: "B" };
  }
}

// ─── Optimierungs-Plan Generator ─────────────────────────────────────────────
export type PlanContext = {
  builder:       BuilderAuditProp | null;
  woo:           WooAuditProp | null;
  speedScore:    number;
  redCount:      number;
  yellowCount:   number;
  url:           string;
};

export function generateOptimizationPlan(ctx: PlanContext): Array<{ title: string; body: string; priority: "red" | "yellow" }> {
  const steps: Array<{ title: string; body: string; priority: "red" | "yellow"; weight: number }> = [];
  const b = ctx.builder;

  // 1. DOM-Verschachtelung
  if (b && b.maxDomDepth > 22) {
    steps.push({
      title: `${b.builder ?? "Page-Builder"}-DOM-Struktur verschlanken`,
      body: `Aktuelle Verschachtelungstiefe: ${b.maxDomDepth} Ebenen, ${b.divCount} <div>-Tags. ${b.builder === "Elementor"
        ? "Migration von Section/Column zu Elementor-Containern (Flexbox) — reduziert Ebenen um ~40 %."
        : b.builder === "Divi"
        ? "Mit Divi 'Collapse Nested Rows' Sections zusammenfassen."
        : "Unnötige Wrapper-Divs entfernen, CSS-Grid statt verschachtelter Rows."}`,
      priority: "red",
      weight:   10,
    });
  } else if (b && b.maxDomDepth > 15) {
    steps.push({
      title: `${b.builder ?? "Builder"}-DOM-Tiefe auf ≤ 15 reduzieren`,
      body:  `DOM-Tiefe aktuell ${b.maxDomDepth}. Google empfiehlt max. 15 — darüber leidet die Render-Performance auf Mobilgeräten.`,
      priority: "yellow",
      weight:   7,
    });
  }

  // 2. Google Fonts
  if (b && b.googleFontFamilies.length > 2) {
    steps.push({
      title: "Google Fonts auf max. 2 Familien reduzieren",
      body:  `${b.googleFontFamilies.length} Font-Familien geladen (${b.googleFontFamilies.slice(0, 3).join(", ")}…). Best Practice: Heading + Body, mehr nicht. Spart typisch 150–400 ms Ladezeit.`,
      priority: "yellow",
      weight:   6,
    });
  }
  if (b && b.googleFontFamilies.length >= 1) {
    steps.push({
      title: "Google Fonts lokal hosten (DSGVO)",
      body:  "Plugin 'OMGF | Host Google Fonts Locally' installieren. Behebt DSGVO-Risiko (LG München 2022) UND spart DNS-Request zu Google-Servern — Ladezeit-Gewinn inklusive.",
      priority: "red",
      weight:   9,
    });
  }

  // 3. CSS-Bloat
  if (b && b.cssBloatHints.length > 0) {
    steps.push({
      title: "Ungenutztes CSS entfernen",
      body:  b.cssBloatHints.slice(0, 2).join(" — "),
      priority: "yellow",
      weight:   5,
    });
  }

  // 4. WooCommerce — wenn Shop
  if (ctx.woo) {
    if (ctx.woo.revenueRiskPct >= 15) {
      steps.push({
        title: "WooCommerce Cart-Fragments auf Nicht-Shop-Seiten deaktivieren",
        body:  `Revenue-at-Risk: ${ctx.woo.revenueRiskPct} %. wc-ajax=get_refreshed_fragments bremst jede Seite. Plugin 'Disable Cart Fragments' installieren oder manuell per Code-Snippet entfernen — spart 200–500 ms Ladezeit.`,
        priority: "red",
        weight:   10,
      });
    }
    if (ctx.woo.pluginImpact.length >= 2) {
      const names = ctx.woo.pluginImpact.map(p => p.name).join(", ");
      steps.push({
        title: "Heavy WooCommerce-Plugins selektiv laden",
        body:  `${names} — mit "Asset CleanUp" oder "Perfmatters" diese Scripts nur auf /shop, /warenkorb, /produkt/* laden. Typisch –40 % TTI auf Blog-/Info-Seiten.`,
        priority: "yellow",
        weight:   7,
      });
    }
    if (ctx.woo.outdatedTemplates) {
      steps.push({
        title: "Veraltete WooCommerce-Template-Overrides aktualisieren",
        body:  "Admin → WooCommerce → Status → Templates. Jeden Override mit Versions-Hinweis neu aus /plugins/woocommerce/templates/ kopieren und eigene Anpassungen mergen. Verhindert Checkout-Fehler nach WC-Updates.",
        priority: "red",
        weight:   9,
      });
    }
  }

  // 5. Performance-Fallback wenn speedScore niedrig
  if (ctx.speedScore < 50 && steps.length < 3) {
    steps.push({
      title: "Caching + Bildkompression aktivieren",
      body:  "WP Rocket oder FlyingPress installieren (Page-Cache + Asset-Minification + Lazy-Load). Bilder mit ShortPixel oder Smush in WebP konvertieren.",
      priority: "yellow",
      weight:   6,
    });
  }

  // Sortieren nach weight (desc) und auf 5 Punkte kappen
  steps.sort((a, b2) => b2.weight - a.weight);
  return steps.slice(0, 5).map(({ title, body, priority }) => ({ title, body, priority }));
}
