import { redirect } from "next/navigation";

/**
 * Legacy-Route — Integrations sind seit dem 01.05.-Refactor Bestandteil
 * des Agency-Branding-Hubs (technisches Agentur-Setup). Alte Bookmarks
 * werden permanent dorthin geleitet.
 */
export default function LegacyIntegrationsRedirect() {
  redirect("/dashboard/agency-branding");
}
