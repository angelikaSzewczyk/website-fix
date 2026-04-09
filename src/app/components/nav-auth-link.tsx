"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function NavAuthLink() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const hasSession = document.cookie
      .split(";")
      .some((c) => c.trim().startsWith("authjs.session-token=") || c.trim().startsWith("__Secure-authjs.session-token="));

    if (hasSession) {
      setLoggedIn(true);
    } else {
      fetch("/api/auth/session", { credentials: "include" })
        .then((r) => r.json())
        .then((data) => setLoggedIn(!!data?.user))
        .catch(() => setLoggedIn(false));
    }
  }, []);

  if (loggedIn) {
    return (
      <Link href="/dashboard" style={{
        fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)",
        textDecoration: "none", padding: "7px 16px",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: 8, background: "rgba(255,255,255,0.05)",
      }}>
        Dashboard →
      </Link>
    );
  }

  // Not logged in (or loading) → link to pricing
  return (
    <Link href="/#pricing" style={{
      fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.65)",
      textDecoration: "none", padding: "7px 16px",
      borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
    }}>
      Preise
    </Link>
  );
}
