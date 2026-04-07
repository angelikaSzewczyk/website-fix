"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function NavAuthLink() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/auth/session", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setLoggedIn(!!data?.user))
      .catch(() => setLoggedIn(false));
  }, []);

  if (loggedIn === null) return null;

  if (loggedIn) {
    return (
      <Link href="/dashboard" style={{
        fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.7)",
        textDecoration: "none", padding: "6px 14px",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 8,
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
