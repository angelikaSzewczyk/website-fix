import type { StoredScan } from "@/lib/scan-storage";

type ContextItem = {
  label: string;
  value: string;
  state: "ok" | "check" | "neutral";
};

export default function TechnicalContext({ scan }: { scan: StoredScan }) {
  const items: ContextItem[] = [
    {
      label: "WordPress",
      value: scan.wpVersion ? `erkannt · Version ${scan.wpVersion}` : "erkannt",
      state: "ok",
    },
    {
      label: "XML-RPC",
      value: scan.xmlRpcOpen ? "erreichbar" : "nicht erreichbar",
      state: "neutral",
    },
    {
      label: "Sitemap",
      value: scan.hasSitemap ? "gefunden" : "nicht erkannt",
      state: scan.hasSitemap ? "ok" : "check",
    },
    {
      label: "robots.txt",
      value: scan.robotsBlocked
        ? "Crawler umfassend blockiert"
        : "keine umfassende Crawl-Sperre erkannt",
      state: scan.robotsBlocked ? "check" : "ok",
    },
    {
      label: "SEO-Plugin",
      value: scan.hasRankMath
        ? "Rank Math erkannt"
        : scan.hasYoast
          ? "Yoast erkannt"
          : "kein unterstütztes Plugin erkannt",
      state: scan.hasRankMath || scan.hasYoast ? "ok" : "neutral",
    },
  ];

  return (
    <section className="wf-results-section">
      <div className="wf-results-section-head">
        <div>
          <span className="wf-results-eyebrow">Technischer Kontext</span>
          <h2>WordPress-Signale aus dem Scan</h2>
        </div>
      </div>

      <div className="wf-results-context">
        {items.map((item) => (
          <div
            className="wf-results-context-item"
            data-state={item.state}
            key={item.label}
          >
            <span className="wf-results-context-dot" aria-hidden="true" />
            <div>
              <strong>{item.label}</strong>
              <span>{item.value}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
