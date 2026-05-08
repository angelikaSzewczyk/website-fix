/**
 * /admin/auth-test — UI zum Auslösen der Port25-Auth-Verification.
 *
 * Klick auf "Test-Mail senden" → POST /api/admin/auth-test → Resend schickt
 * Mail an check-auth@verifier.port25.com → Port25 antwortet ~1 Min später
 * mit komplettem SPF/DKIM/DMARC/SpamAssassin-Report an ADMIN_EMAIL.
 *
 * Auth-Gate: Server-Component prüft Admin-Email. Falls nicht admin → 404.
 */

import { auth } from "@/auth";
import { notFound } from "next/navigation";
import AuthTestClient from "./auth-test-client";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";

export const metadata = { robots: { index: false, follow: false } };

export default async function AuthTestPage() {
  const session = await auth();
  if (!ADMIN_EMAIL || session?.user?.email !== ADMIN_EMAIL) {
    notFound();
  }

  return <AuthTestClient adminEmail={ADMIN_EMAIL} />;
}
