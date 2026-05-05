/**
 * /admin/finance — Finanz-Analytics für Admin.
 *
 * Zeigt:
 *   - 30-Tage-Brutto-Umsatz (Guides + Subscription-Schätzung)
 *   - One-Time-Sales (rescue_guides) Detail-Tabelle
 *   - Subscriptions-Übersicht (users.plan-Verteilung × MRR)
 *   - Top-Selling-Guides Ranking
 *
 * Admin-Gate: process.env.ADMIN_EMAIL muss === session.user.email sein.
 */

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import type { Metadata } from "next";
import Link from "next/link";
import { PLAN_MRR } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Finanz-Analytics — WebsiteFix Admin",
  robots: { index: false, follow: false },
};

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";

const T = {
  page:      "#0b0c10",
  card:      "rgba(255,255,255,0.025)",
  border:    "rgba(255,255,255,0.08)",
  divider:   "rgba(255,255,255,0.06)",
  text:      "rgba(255,255,255,0.92)",
  textSub:   "rgba(255,255,255,0.55)",
  textMuted: "rgba(255,255,255,0.40)",
  green:     "#4ade80",
  greenBg:   "rgba(74,222,128,0.10)",
  greenBdr:  "rgba(74,222,128,0.28)",
  amber:     "#fbbf24",
  blue:      "#7aa6ff",
  purple:    "#a78bfa",
  purpleBg:  "rgba(124,58,237,0.18)",
  purpleBdr: "rgba(124,58,237,0.40)",
};

function formatEuro(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}

/** Stripe-Standard-Gebühren EU: 2,9% + 0,30 € pro erfolgreicher Transaktion.
 *  Annahme: One-Time-Guides = N Transaktionen mit jeweils 0,30 €-Sockel.
 *  Subscriptions = monatlich 1 Transaktion pro aktivem Kunden — d.h. der
 *  Sockel-Anteil pro Cycle ist count*0,30 €.
 *  Quelle: stripe.com/de/pricing — bei Custom-Rates später anpassen. */
function stripeFees(grossCents: number, transactionCount: number): number {
  const percentageFee = Math.round(grossCents * 0.029);
  const fixedFee      = transactionCount * 30;
  return percentageFee + fixedFee;
}

export default async function FinancePage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  if (!ADMIN_EMAIL || session.user.email !== ADMIN_EMAIL) redirect("/dashboard");

  const sql = neon(process.env.DATABASE_URL!);

  // ── 30-Tage-One-Time-Sales (Guides) ────────────────────────────────────
  const guideSales = await sql`
    SELECT
      COUNT(*)::int                                          AS total_sales,
      COALESCE(SUM(paid_amount_cents), 0)::int               AS total_cents,
      COUNT(*) FILTER (WHERE unlocked_at >= NOW() - INTERVAL '30 days')::int  AS sales_30d,
      COALESCE(SUM(paid_amount_cents) FILTER (WHERE unlocked_at >= NOW() - INTERVAL '30 days'), 0)::int  AS cents_30d
    FROM user_unlocked_guides
  ` as Array<{ total_sales: number; total_cents: number; sales_30d: number; cents_30d: number }>;
  const sales = guideSales[0];

  // ── Subscription-Verteilung (für MRR-Berechnung) ──────────────────────
  const planDist = await sql`
    SELECT plan, COUNT(*)::int AS count
    FROM users
    WHERE plan IS NOT NULL AND plan <> 'free'
    GROUP BY plan
    ORDER BY count DESC
  ` as Array<{ plan: string; count: number }>;

  let mrrCents = 0;
  for (const p of planDist) {
    const planMrr = PLAN_MRR[p.plan] ?? 0; // PLAN_MRR ist in Euro
    mrrCents += planMrr * 100 * p.count;
  }
  const arrCents = mrrCents * 12;

  // ── Top-Selling-Guides (lifetime) ───────────────────────────────────────
  const topGuides = await sql`
    SELECT
      g.id,
      g.title,
      g.problem_label,
      COUNT(u.id)::int                              AS sales_count,
      COALESCE(SUM(u.paid_amount_cents), 0)::int    AS revenue_cents,
      COUNT(u.id) FILTER (WHERE u.unlocked_at >= NOW() - INTERVAL '30 days')::int AS sales_30d
    FROM rescue_guides g
    LEFT JOIN user_unlocked_guides u ON u.guide_id = g.id
    GROUP BY g.id, g.title, g.problem_label
    ORDER BY sales_count DESC, g.id ASC
  ` as Array<{ id: string; title: string; problem_label: string; sales_count: number; revenue_cents: number; sales_30d: number }>;

  // ── Hoster-Verteilung (für Content-Pflege-Priorisierung) ──────────────
  const hosterDist = await sql`
    SELECT COALESCE(hoster, 'unbekannt') AS hoster, COUNT(*)::int AS count
    FROM user_unlocked_guides
    GROUP BY hoster
    ORDER BY count DESC
  ` as Array<{ hoster: string; count: number }>;

  // 30-Tage-Brutto: One-Time + 30-Tage-Anteil der MRR (vereinfachte Annahme:
  // monatliche Subscriptions zahlen einmal pro Monat → MRR ≈ 30-Tage-Revenue
  // bei stabiler Kundenanzahl)
  const total30dCents = sales.cents_30d + mrrCents;

  // ── Stripe-Fees + Netto-Gewinn (30-Tage-Fenster) ───────────────────────
  // Transaktions-Count: One-Time-Sales (sales.sales_30d) plus eine Transaktion
  // pro aktivem Subscription-Cycle (Summe planDist.count über alle Plans).
  const subscriberCount    = planDist.reduce((acc, p) => acc + p.count, 0);
  const transactionCount30d = sales.sales_30d + subscriberCount;
  const stripeFees30dCents  = stripeFees(total30dCents, transactionCount30d);
  const net30dCents         = total30dCents - stripeFees30dCents;
  const netMarginPct        = total30dCents > 0
    ? Math.round((net30dCents / total30dCents) * 100)
    : 100;

  return (
    <main style={{ minHeight: "100vh", background: T.page, color: T.text, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", padding: "32px 32px 80px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>

        {/* Top-Bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, gap: 16, flexWrap: "wrap" }}>
          <Link href="/admin" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 12.5, fontWeight: 600, color: T.textSub,
            textDecoration: "none", padding: "7px 14px", borderRadius: 8,
            background: T.card, border: `1px solid ${T.border}`,
          }}>
            ← Zurück zum Command-Center
          </Link>
          <span style={{
            fontSize: 11, fontWeight: 700,
            padding: "4px 12px", borderRadius: 6,
            background: T.purpleBg, border: `1px solid ${T.purpleBdr}`,
            color: T.purple, letterSpacing: "0.06em",
          }}>
            ADMIN-ONLY
          </span>
        </div>

        {/* Hero */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 800, color: T.purple, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Finanzielle Übersicht
          </p>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: T.text, letterSpacing: "-0.025em" }}>
            Finanz-Analytics
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: T.textSub, maxWidth: 720, lineHeight: 1.55 }}>
            Brutto-Umsatz der letzten 30 Tage, Subscription- vs. One-Time-Sales-Mix, Top-Selling-Guides.
          </p>
        </div>

        {/* ── KPI-Strip (4 Karten) ──────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 28 }}>

          {/* Total-30d (Brutto) */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 20px" }}>
            <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: T.purple, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Brutto · 30 Tage
            </p>
            <div style={{ fontSize: 30, fontWeight: 800, color: T.green, letterSpacing: "-0.025em", lineHeight: 1 }}>
              {formatEuro(total30dCents)}
            </div>
            <p style={{ margin: "8px 0 0", fontSize: 11, color: T.textMuted }}>
              {formatEuro(mrrCents)} Subs + {formatEuro(sales.cents_30d)} Guides
            </p>
          </div>

          {/* Netto-Gewinn (nach Stripe-Fees) */}
          <div style={{
            background: "rgba(74,222,128,0.06)",
            border: `1px solid ${T.greenBdr}`,
            borderRadius: 14, padding: "18px 20px",
          }}>
            <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: T.green, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Netto · nach Gebühren
            </p>
            <div style={{ fontSize: 30, fontWeight: 800, color: T.green, letterSpacing: "-0.025em", lineHeight: 1 }}>
              {formatEuro(net30dCents)}
            </div>
            <p style={{ margin: "8px 0 0", fontSize: 11, color: T.textMuted }}>
              − {formatEuro(stripeFees30dCents)} Stripe-Fees · {netMarginPct}% Marge
            </p>
          </div>

          {/* MRR */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 20px" }}>
            <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: T.blue, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              MRR (Subscriptions)
            </p>
            <div style={{ fontSize: 30, fontWeight: 800, color: T.blue, letterSpacing: "-0.025em", lineHeight: 1 }}>
              {formatEuro(mrrCents)}
            </div>
            <p style={{ margin: "8px 0 0", fontSize: 11, color: T.textMuted }}>
              ARR: {formatEuro(arrCents)}
            </p>
          </div>

          {/* Guide-Sales 30 Tage */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 20px" }}>
            <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: T.amber, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Guide-Sales · 30 Tage
            </p>
            <div style={{ fontSize: 30, fontWeight: 800, color: T.amber, letterSpacing: "-0.025em", lineHeight: 1 }}>
              {sales.sales_30d}
            </div>
            <p style={{ margin: "8px 0 0", fontSize: 11, color: T.textMuted }}>
              {formatEuro(sales.cents_30d)} Brutto
            </p>
          </div>

          {/* Lifetime-Guides */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 20px" }}>
            <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Guides · Lifetime
            </p>
            <div style={{ fontSize: 30, fontWeight: 800, color: T.text, letterSpacing: "-0.025em", lineHeight: 1 }}>
              {sales.total_sales}
            </div>
            <p style={{ margin: "8px 0 0", fontSize: 11, color: T.textMuted }}>
              {formatEuro(sales.total_cents)} gesamt
            </p>
          </div>
        </div>

        {/* ── 2-Spalten: Top-Guides + Hoster-Mix ────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18, marginBottom: 28 }} className="finance-cols">

          {/* Top-Selling-Guides */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.divider}` }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: T.text }}>
                Top-Selling-Guides
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: T.textMuted }}>
                Welches Problem zahlen die User am meisten?
              </p>
            </div>
            {topGuides.length === 0 ? (
              <div style={{ padding: "32px 20px", textAlign: "center", fontSize: 13, color: T.textMuted }}>
                Noch keine Guide-Verkäufe.
              </div>
            ) : (
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {topGuides.map((g, i) => (
                  <li key={g.id} style={{
                    display: "grid", gridTemplateColumns: "32px 1fr 100px 120px 100px",
                    gap: 12, alignItems: "center",
                    padding: "12px 20px",
                    borderBottom: i < topGuides.length - 1 ? `1px solid ${T.divider}` : "none",
                  }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: i === 0 ? T.amber : i === 1 ? "#cbd5e1" : i === 2 ? "#92400e" : T.textMuted }}>
                      {i + 1}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {g.title}
                      </div>
                      <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>
                        {g.problem_label}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>
                        {g.sales_count}
                      </div>
                      <div style={{ fontSize: 10, color: T.textMuted }}>Verkäufe</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: T.green }}>
                        {formatEuro(g.revenue_cents)}
                      </div>
                      <div style={{ fontSize: 10, color: T.textMuted }}>Brutto</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: g.sales_30d > 0 ? T.amber : T.textMuted }}>
                        {g.sales_30d}× / 30T
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Subscription-Verteilung */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 20px" }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: T.text }}>
              Plan-Verteilung
            </p>
            <p style={{ margin: "2px 0 18px", fontSize: 11, color: T.textMuted }}>
              MRR-Beitrag pro Plan-Tier
            </p>
            {planDist.length === 0 ? (
              <div style={{ fontSize: 12, color: T.textMuted }}>Keine zahlenden Kunden.</div>
            ) : (
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                {planDist.map(p => {
                  const mrr = (PLAN_MRR[p.plan] ?? 0) * 100 * p.count;
                  return (
                    <li key={p.plan} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 7, background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}` }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{p.plan}</div>
                        <div style={{ fontSize: 10, color: T.textMuted }}>{p.count} {p.count === 1 ? "Kunde" : "Kunden"}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: T.green }}>{formatEuro(mrr)}</div>
                        <div style={{ fontSize: 10, color: T.textMuted }}>MRR</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* ── Hoster-Mix (für Content-Priorisierung) ────────────────────── */}
        {hosterDist.length > 0 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 20px" }}>
            <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 800, color: T.text }}>
              Hoster-Mix der Guide-Käufer
            </p>
            <p style={{ margin: "0 0 18px", fontSize: 11, color: T.textMuted }}>
              Wo sollten wir den Content priorisiert ausbauen?
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
              {hosterDist.map(h => (
                <div key={h.hoster} style={{ padding: "12px 14px", borderRadius: 9, background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>{h.count}</div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>{h.hoster}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <style>{`
          @media (max-width: 980px) {
            .finance-cols { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </div>
    </main>
  );
}
