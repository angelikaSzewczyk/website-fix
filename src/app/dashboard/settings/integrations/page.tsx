import { redirect } from "next/navigation";

/**
 * Legacy-Route — wird seit dem Settings-Hub-Refactor (3 Tabs unter
 * /dashboard/settings) nur noch als Redirect genutzt. Alte Bookmarks,
 * Email-Links und externe Referenzen landen sauber auf dem neuen
 * Integrations-Tab.
 */
export default function LegacyIntegrationsRedirect() {
  redirect("/dashboard/settings#integrationen");
}
