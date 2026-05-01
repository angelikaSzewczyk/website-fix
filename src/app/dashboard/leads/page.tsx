/**
 * Permanent redirect — Lead-Management wurde im High-End-Refactor
 * (01.05.2026) in den Lead-Generator-Hub konsolidiert. Diese Route bleibt
 * als 308-Redirect für Bookmarks und externe Links erhalten.
 */
import { redirect } from "next/navigation";

export default function LeadsRedirect() {
  redirect("/dashboard/lead-generator#leads");
}
