import { auth } from "@/auth";
import { redirect } from "next/navigation";

const C = {
  card:      "#FFFFFF",
  border:    "#E2E8F0",
  divider:   "#F1F5F9",
  shadow:    "0 1px 4px rgba(0,0,0,0.07)",
  text:      "#0F172A",
  textSub:   "#475569",
  textMuted: "#94A3B8",
  blue:      "#2563EB",
  blueBg:    "#EFF6FF",
  blueBorder:"#BFDBFE",
  amber:     "#D97706",
  amberBg:   "#FFFBEB",
  amberBorder:"#FDE68A",
};

const UPCOMING = [
  { icon: "👤", title: "Mitarbeiter einladen",     desc: "Team-Mitglieder per E-Mail einladen und Rollen vergeben." },
  { icon: "🔐", title: "Rollen & Berechtigungen",  desc: "Admin, Redakteur, Nur-Lesen — feingranulare Zugriffskontrolle." },
  { icon: "📊", title: "Team-Aktivität",            desc: "Wer hat welchen Scan gestartet? Vollständiges Audit-Log." },
  { icon: "🌐", title: "Kunden-Zugang",             desc: "Kunden ihren eigenen Read-only Zugang zu Reports geben." },
];

export default async function TeamPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "40px 24px 80px" }}>

      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 6px", color: C.text, letterSpacing: "-0.02em" }}>
          Mein Team
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: C.textMuted }}>
          Mehrere Nutzer, Rollen und Kunden-Zugänge verwalten.
        </p>
      </div>

      {/* Coming soon hero */}
      <div style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        boxShadow: C.shadow,
        padding: "48px 40px",
        textAlign: "center",
        marginBottom: 32,
      }}>
        {/* Illustration */}
        <div style={{
          width: 72, height: 72, borderRadius: 20,
          background: C.amberBg, border: `1px solid ${C.amberBorder}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px",
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.amber} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>

        <span style={{
          display: "inline-block", marginBottom: 16,
          fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 6,
          background: C.amberBg, color: C.amber, border: `1px solid ${C.amberBorder}`,
          letterSpacing: "0.08em",
        }}>
          IN ENTWICKLUNG
        </span>

        <h2 style={{ margin: "0 0 12px", fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: "-0.02em" }}>
          Team-Management kommt bald
        </h2>
        <p style={{ margin: "0 0 28px", fontSize: 14, color: C.textSub, lineHeight: 1.7, maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}>
          Lade Kollegen ein, vergib Rollen und gib Kunden Zugang zu ihren eigenen Reports — alles in einer Oberfläche.
        </p>

        <a href="mailto:support@website-fix.com?subject=Team-Feature%20Interesse" style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "10px 22px", borderRadius: 10, textDecoration: "none",
          fontSize: 14, fontWeight: 700,
          background: C.blue, color: "#fff",
          boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
        }}>
          Frühzugang anfragen →
        </a>
      </div>

      {/* Feature preview cards */}
      <p style={{ margin: "0 0 16px", fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.12em" }}>
        Geplante Features
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {UPCOMING.map(f => (
          <div key={f.title} style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: "18px 20px",
            boxShadow: C.shadow,
            opacity: 0.75,
          }}>
            <div style={{ fontSize: 22, marginBottom: 10 }}>{f.icon}</div>
            <p style={{ margin: "0 0 5px", fontSize: 14, fontWeight: 700, color: C.text }}>{f.title}</p>
            <p style={{ margin: 0, fontSize: 12, color: C.textSub, lineHeight: 1.6 }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
