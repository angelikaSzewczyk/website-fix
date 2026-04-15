"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ScanReset() {
  const router = useRouter();

  useEffect(() => {
    try {
      localStorage.removeItem("wf_free_scan_ts");
    } catch { /* ignore */ }
    router.replace("/");
  }, [router]);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#08090D", color: "#fff", fontFamily: "sans-serif", fontSize: 14,
    }}>
      Scan-Sperre wird aufgehoben…
    </div>
  );
}
