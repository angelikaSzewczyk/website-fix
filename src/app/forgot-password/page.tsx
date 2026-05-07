import type { Metadata } from "next";
import { Suspense } from "react";
import ForgotPasswordClient from "./forgot-password-client";

export const metadata: Metadata = {
  title: "Passwort setzen / zurücksetzen — WebsiteFix",
  robots: { index: false },
};

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{ background: "#0b0c10", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Lade…</div>
      </div>
    }>
      <ForgotPasswordClient />
    </Suspense>
  );
}
