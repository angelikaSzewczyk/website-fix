"use server";

import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";
import { revalidatePath } from "next/cache";

/**
 * Lead-to-Client — Wandelt einen widget_lead in ein saved_websites-Projekt um.
 *
 * Why: Der Widget-Lead hat scanned_url + visitor_email. Wenn die Agentur den
 * Lead in eine echte Geschäftsbeziehung überführt, soll die Site mit einem
 * Klick im Portfolio landen — ohne erneute manuelle URL-Eingabe.
 *
 * Idempotent: gibt es bereits ein saved_websites-Projekt mit derselben URL,
 * wird nichts gemacht, nur der Lead-Status auf "converted" gesetzt.
 */
export async function convertLeadToClient(leadId: string): Promise<
  | { ok: true; alreadyExists: boolean; websiteId: string }
  | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Nicht eingeloggt" };

  const userId = session.user.id;
  const sql = neon(process.env.DATABASE_URL!);

  // Lead abrufen — Owner-Check via agency_user_id verhindert horizontalen Zugriff.
  const [lead] = await sql`
    SELECT id::text, scanned_url, visitor_email, status
    FROM widget_leads
    WHERE id::text = ${leadId} AND agency_user_id = ${userId}
    LIMIT 1
  ` as Array<{ id: string; scanned_url: string; visitor_email: string | null; status: string | null }>;

  if (!lead) return { ok: false, error: "Lead nicht gefunden" };

  // Domain als Display-Name extrahieren — der Lead hat nur eine URL.
  let displayName = lead.scanned_url;
  try {
    displayName = new URL(lead.scanned_url).hostname.replace(/^www\./, "");
  } catch { /* fallback bleibt URL */ }

  // Idempotenz: existiert die URL bereits im Portfolio?
  const [existing] = await sql`
    SELECT id::text FROM saved_websites
    WHERE user_id = ${userId} AND url = ${lead.scanned_url}
    LIMIT 1
  ` as Array<{ id: string }>;

  let websiteId: string;
  let alreadyExists: boolean;

  if (existing) {
    websiteId = existing.id;
    alreadyExists = true;
  } else {
    const [created] = await sql`
      INSERT INTO saved_websites (user_id, url, name, is_customer_project)
      VALUES (${userId}, ${lead.scanned_url}, ${displayName}, TRUE)
      RETURNING id::text
    ` as Array<{ id: string }>;
    websiteId = created.id;
    alreadyExists = false;
  }

  // Lead-Status auf converted setzen — der Konversionspfad ist abgeschlossen.
  await sql`
    UPDATE widget_leads SET status = 'converted'
    WHERE id::text = ${leadId} AND agency_user_id = ${userId}
  `;

  // Cache invalidieren für beide Pages, die widget_leads/saved_websites lesen.
  revalidatePath("/dashboard/lead-generator");
  revalidatePath("/dashboard/clients");
  revalidatePath("/dashboard");

  return { ok: true, alreadyExists, websiteId };
}
