import type { Metadata } from "next";
import Link from "next/link";
import { signIn } from "@/auth";

export const metadata: Metadata = {
  title: "Login — WebsiteFix",
  robots: { index: false },
};

export default function LoginPage({ searchParams }: { searchParams: { callbackUrl?: string } }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #060d1a 0%, #0a1628 40%, #0d1f3c 70%, #071020 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "40px 24px",
      position: "relative", overflow: "hidden",
    }}>
      {/* Background glow orbs */}
      <div style={{ position: "absolute", top: "15%", left: "20%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "20%", right: "15%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,123,255,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Back link */}
      <Link href="/" style={{
        position: "absolute", top: 24, left: 24,
        fontSize: 13, color: "rgba(255,255,255,0.35)", textDecoration: "none",
        display: "flex", alignItems: "center", gap: 6,
      }}>
        ← Startseite
      </Link>

      {/* Glassmorphism card */}
      <div style={{
        width: "100%", maxWidth: 400,
        background: "rgba(255,255,255,0.05)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 20,
        padding: "44px 40px 40px",
        boxShadow: "0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04) inset",
        textAlign: "center",
        position: "relative",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 32 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 11,
            background: "linear-gradient(135deg, #2563EB, #1d4ed8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 16px rgba(37,99,235,0.4)",
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: 18, color: "#fff", letterSpacing: "-0.02em" }}>
            Website<span style={{ color: "#2563EB" }}>Fix</span>
          </span>
        </div>

        {/* Heading */}
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 8px", letterSpacing: "-0.02em", color: "#fff" }}>
          Willkommen zurück
        </h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", margin: "0 0 32px", lineHeight: 1.6 }}>
          Meld dich an, um auf dein Dashboard zuzugreifen.
        </p>

        {/* Google button */}
        <form action={async () => {
          "use server";
          await signIn("google", { redirectTo: searchParams.callbackUrl ?? "/dashboard" });
        }}>
          <button type="submit" style={{
            width: "100%",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
            padding: "13px 24px",
            background: "#fff", color: "#111",
            border: "none", borderRadius: 10,
            fontSize: 15, fontWeight: 600, cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}>
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.1-2.7-.4-4z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.4-5l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.2 0-9.5-2.9-11.3-7.1l-6.5 5C9.5 39.6 16.3 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.5-2.6 4.6-4.8 6l6.2 5.2C40.5 35.8 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"/>
            </svg>
            Mit Google einloggen
          </button>
        </form>

        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", margin: "20px 0 0", lineHeight: 1.6 }}>
          Kein Account nötig — Google-Login reicht.
        </p>

        {/* Divider */}
        <div style={{ margin: "28px 0 0", padding: "20px 0 0", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
            {["WCAG 2.1", "BFSG-ready", "White-Label"].map(badge => (
              <span key={badge} style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                ✓ {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
