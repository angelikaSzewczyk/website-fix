import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";

// DEV ONLY — seeds mock client websites for testing the Clients dashboard
// POST /api/dev/seed-clients

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sql = neon(process.env.DATABASE_URL!);

  const mockSites = [
    {
      url: "https://bäckerei-schmidt.de",
      name: "Bäckerei Schmidt",
      platform: "WordPress",
      status: "ok",
      ssl_days_left: 87,
      security_score: 72,
      response_time_ms: 340,
    },
    {
      url: "https://shop.modehaus-weber.de",
      name: "Modehaus Weber Shop",
      platform: "Shopify",
      status: "warning",
      ssl_days_left: 12,
      security_score: 61,
      response_time_ms: 820,
    },
    {
      url: "https://kanzlei-mueller.de",
      name: "Kanzlei Müller & Partner",
      platform: "Custom",
      status: "critical",
      ssl_days_left: 3,
      security_score: 38,
      response_time_ms: 1240,
    },
    {
      url: "https://physiotherapie-hofmann.de",
      name: "Physiotherapie Hofmann",
      platform: "WordPress",
      status: "ok",
      ssl_days_left: 145,
      security_score: 85,
      response_time_ms: 290,
    },
    {
      url: "https://autohaus-brandt.de",
      name: "Autohaus Brandt GmbH",
      platform: "Custom",
      status: "warning",
      ssl_days_left: 28,
      security_score: 55,
      response_time_ms: 640,
    },
    {
      url: "https://restaurant-bella-italia.de",
      name: "Bella Italia Ristorante",
      platform: "WordPress",
      status: "ok",
      ssl_days_left: 201,
      security_score: 78,
      response_time_ms: 410,
    },
    {
      url: "https://zahnarzt-dr-klein.de",
      name: "Dr. Klein Zahnmedizin",
      platform: "Custom",
      status: "offline",
      ssl_days_left: null,
      security_score: null,
      response_time_ms: null,
    },
  ];

  let inserted = 0;

  for (const site of mockSites) {
    // Insert or skip if URL already exists for this user
    const existing = await sql`
      SELECT id FROM saved_websites WHERE url = ${site.url} AND user_id = ${session.user.id} LIMIT 1
    `;
    if (existing.length > 0) continue;

    const [sw] = await sql`
      INSERT INTO saved_websites (user_id, url, name, last_check_at, last_check_status)
      VALUES (${session.user.id}, ${site.url}, ${site.name}, NOW(), ${site.status})
      RETURNING id
    ` as { id: string }[];

    if (sw) {
      await sql`
        INSERT INTO website_checks (
          website_id, user_id, is_online, response_time_ms,
          ssl_valid, ssl_days_left, platform, security_score,
          security_headers, http_status, alerts
        ) VALUES (
          ${sw.id}, ${session.user.id},
          ${site.status !== "offline"},
          ${site.response_time_ms},
          ${site.ssl_days_left !== null && site.ssl_days_left > 0},
          ${site.ssl_days_left},
          ${site.platform},
          ${site.security_score},
          ${"{}"},
          ${site.status === "offline" ? null : 200},
          ${JSON.stringify(
            site.status === "offline"
              ? [{ level: "critical", message: "Website nicht erreichbar" }]
              : site.status === "critical"
              ? [{ level: "critical", message: `SSL läuft in ${site.ssl_days_left} Tagen ab` }, { level: "critical", message: "Sicherheits-Score kritisch" }]
              : site.status === "warning"
              ? [{ level: "warning", message: site.ssl_days_left && site.ssl_days_left <= 30 ? `SSL läuft in ${site.ssl_days_left} Tagen ab` : "Langsame Ladezeit" }]
              : []
          )}
        )
      `;
      inserted++;
    }
  }

  return NextResponse.json({ ok: true, inserted, total: mockSites.length });
}
