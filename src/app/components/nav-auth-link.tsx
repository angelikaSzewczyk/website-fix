"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function NavAuthLink() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    // NextAuth v5 setzt authjs.session-token als Cookie
    const hasSession = document.cookie
      .split(";")
      .some((c) => c.trim().startsWith("authjs.session-token=") || c.trim().startsWith("__Secure-authjs.session-token="));

    if (hasSession) {
      setLoggedIn(true);
    } else {
      // Fallback: API check
      fetch("/api/auth/session", { credentials: "include" })
        .then((r) => r.json())
        .then((data) => setLoggedIn(!!data?.user))
        .catch(() => setLoggedIn(false));
    }
  }, []);

  if (loggedIn === null) {
    return (
      <Link href="/fuer-agenturen" className="cta ctaSmall">
        Für Agenturen
      </Link>
    );
  }

  if (loggedIn) {
    return (
      <Link href="/dashboard" style={{
        fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.8)",
        textDecoration: "none", padding: "7px 16px",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: 8, background: "rgba(255,255,255,0.05)",
      }}>
        Dashboard →
      </Link>
    );
  }

  return (
    <Link href="/fuer-agenturen" className="cta ctaSmall">
      Für Agenturen
    </Link>
  );
}
