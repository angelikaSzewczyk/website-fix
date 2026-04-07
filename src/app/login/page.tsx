import type { Metadata } from "next";
import Link from "next/link";
import { signIn } from "@/auth";

export const metadata: Metadata = {
  title: "Login — WebsiteFix",
  robots: { index: false },
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string };
}) {
  return (
    <>
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(11,12,16,0.92)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 20px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none", color: "#fff", fontWeight: 700, fontSize: 17 }}>
            Website<span style={{ background: "linear-gradient(90deg,#8df3d3,#7aa6ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Fix</span>
          </Link>
        </div>
      </nav>

      <main style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        <div style={{ width: "100%", maxWidth: 400, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔐</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Einloggen</h1>
          <p className="muted" style={{ marginBottom: 32 }}>
            Zugang zu deinem Dashboard und deiner Scan-History.
          </p>

          <form
            action={async () => {
              "use server";
              await signIn("google", {
                redirectTo: searchParams.callbackUrl ?? "/dashboard",
              });
            }}
          >
            <button
              type="submit"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                padding: "14px 24px",
                background: "#fff",
                color: "#111",
                border: "none",
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.1-2.7-.4-4z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.4-5l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.2 0-9.5-2.9-11.3-7.1l-6.5 5C9.5 39.6 16.3 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.5-2.6 4.6-4.8 6l6.2 5.2C40.5 35.8 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"/>
              </svg>
              Mit Google einloggen
            </button>
          </form>

          <p className="muted" style={{ fontSize: 13, marginTop: 20 }}>
            Kein Account nötig — einfach einloggen, fertig.
          </p>
        </div>
      </main>
    </>
  );
}
