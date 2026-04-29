# E2E-Plan-Gate-Spec (Phase 6)

Browser-Level-Tests für die 5 Personas aus Spec §4.5. Skizze für Playwright;
runnable wenn `@playwright/test` als devDep installiert wird (`playwright-core`
ist bereits drin für andere Zwecke).

## Setup-Vorbedingungen

DB-Seed mit den 5 Test-Usern (idealerweise eine separate Test-DB):

```sql
-- alle gleicher Hash, da Login nur als Sanity-Check, nicht als Auth-Test
INSERT INTO users (email, name, password_hash, plan) VALUES
  ('starter@test.de', 'Starter Tester',  '<hash>', 'starter'),
  ('pro@test.de',     'Pro Tester',      '<hash>', 'professional'),
  ('agency@test.de',  'Agency Tester',   '<hash>', 'agency'),
  ('legacy@test.de',  'Legacy Pro',      '<hash>', 'smart-guard'),
  ('null@test.de',    'No-Plan User',    '<hash>', NULL);
```

Plus mindestens **ein Scan pro User** (sonst rendert das Dashboard im Empty-State,
die LockedSections fehlen, weil sie nur `lastScan && …` rendern).

## Test-Pattern (Playwright Pseudo-Code)

```ts
import { test, expect, Page } from "@playwright/test";

const PERSONAS = [
  {
    email: "starter@test.de", label: "Starter",
    expectsRedirect: false,
    sees: {
      lockedHistory: true, lockedShopAudit: true, lockedGsc: false /* hidden, not locked */,
      actionBar: false, teamWidget: false, kundenMatrix: false,
      brandingTopBar: false,
      upgradeBanner: true, scanLimitCounter: "X / 5",
    },
  },
  {
    email: "pro@test.de", label: "Professional",
    expectsRedirect: false,
    sees: {
      lockedHistory: false, lockedShopAudit: false, lockedGsc: true /* gelockt mit Agency-Upsell */,
      actionBar: true, teamWidget: false, kundenMatrix: false,
      brandingTopBar: false,
      upgradeBanner: false, scanLimitCounter: "X / 25",
    },
  },
  {
    email: "agency@test.de", label: "Agency",
    expectsRedirect: false,
    sees: {
      lockedHistory: null /* Agency hat agency-layout, nicht single */,
      lockedShopAudit: null,
      lockedGsc: false /* full access */,
      actionBar: null /* nur in scan-detail */,
      teamWidget: true, kundenMatrix: true,
      brandingTopBar: true,
      upgradeBanner: false, scanLimitCounter: null,
    },
  },
  {
    email: "legacy@test.de", label: "Legacy smart-guard → Pro",
    expectsRedirect: false,
    sees: {
      // Identisch zu pro@test.de — normalizePlan() mappt smart-guard → professional
      lockedHistory: false, lockedShopAudit: false, lockedGsc: true,
      actionBar: true, teamWidget: false, kundenMatrix: false,
      brandingTopBar: false,
      upgradeBanner: false, scanLimitCounter: "X / 25",
    },
  },
  {
    email: "null@test.de", label: "Plan = NULL",
    expectsRedirect: true /* sollte zu /login redirected werden */,
  },
];

async function loginAs(page: Page, email: string) {
  await page.goto("/login");
  await page.fill("[name=email]", email);
  await page.fill("[name=password]", "test-password");
  await page.click("button[type=submit]");
  await page.waitForURL(/\/dashboard/);
}

for (const p of PERSONAS) {
  test.describe(`Persona: ${p.label}`, () => {
    test.beforeEach(async ({ page }) => { await loginAs(page, p.email); });

    if (p.expectsRedirect) {
      test("wird zu /login redirected (Plan-NULL)", async ({ page }) => {
        await page.goto("/dashboard");
        await expect(page).toHaveURL(/\/login/);
      });
      return;
    }

    test("Dashboard rendert ohne Crash", async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard/);
    });

    if (p.sees.lockedHistory !== null) {
      test(`History-Chart Lock-Card ${p.sees.lockedHistory ? "sichtbar" : "nicht sichtbar"}`, async ({ page }) => {
        const lock = page.locator('[data-testid="locked-history-chart"]');
        if (p.sees.lockedHistory) await expect(lock).toBeVisible();
        else                      await expect(lock).toHaveCount(0);
      });
    }

    if (p.sees.lockedShopAudit !== null) {
      test(`Shop-Audit Lock-Card ${p.sees.lockedShopAudit ? "sichtbar" : "nicht sichtbar"}`, async ({ page }) => {
        const lock = page.locator('[data-testid="locked-shop-audit"]');
        if (p.sees.lockedShopAudit) await expect(lock).toBeVisible();
        else                        await expect(lock).toHaveCount(0);
      });
    }

    if (p.sees.lockedGsc !== null) {
      test(`GSC-Card Lock ${p.sees.lockedGsc ? "sichtbar" : "voll/versteckt"}`, async ({ page }) => {
        const lock = page.locator('[data-testid="locked-gsc"]');
        if (p.sees.lockedGsc) await expect(lock).toBeVisible();
        else                  await expect(lock).toHaveCount(0);
      });
    }

    test(`Team-Widget ${p.sees.teamWidget ? "sichtbar" : "nicht im DOM"}`, async ({ page }) => {
      const widget = page.locator('aside[aria-label="Team-Mitglieder"]');
      if (p.sees.teamWidget) await expect(widget).toBeVisible();
      else                   await expect(widget).toHaveCount(0);
    });

    test(`Kunden-Matrix ${p.sees.kundenMatrix ? "sichtbar" : "nicht im DOM"}`, async ({ page }) => {
      const matrix = page.getByText("Kunden-Matrix", { exact: false });
      if (p.sees.kundenMatrix) await expect(matrix).toBeVisible();
      else                     await expect(matrix).toHaveCount(0);
    });

    test(`White-Label TopBar ${p.sees.brandingTopBar ? "sichtbar" : "nicht im DOM"}`, async ({ page }) => {
      const topbar = page.getByText("White-Label", { exact: false });
      if (p.sees.brandingTopBar) await expect(topbar.first()).toBeVisible();
      else                       await expect(topbar).toHaveCount(0);
    });

    if (p.sees.actionBar !== null) {
      test(`Action-Bar (Issue → Asana/Slack) ${p.sees.actionBar ? "sichtbar" : "nicht im DOM"}`, async ({ page }) => {
        // Issue-Liste expandieren — erstes Item öffnen
        const firstIssue = page.locator('[id^="wf-issue-"]').first();
        await firstIssue.click();
        const bar = page.getByRole("group", { name: "Issue-Aktionen" });
        if (p.sees.actionBar) await expect(bar).toBeVisible();
        else                  await expect(bar).toHaveCount(0);
      });
    }

    // ── API-Hardening: Cross-Plan-Calls werden abgewiesen ─────────────────
    test("API /api/team — Plan-Gate", async ({ page, request }) => {
      const cookies = (await page.context().cookies()).map(c => `${c.name}=${c.value}`).join("; ");
      const res = await request.get("/api/team", { headers: { Cookie: cookies } });
      if (p.label === "Agency") expect(res.status()).toBe(200);
      else                      expect(res.status()).toBe(403);
    });

    test("API /api/integrations/export-task — Pro-Gate", async ({ page, request }) => {
      const cookies = (await page.context().cookies()).map(c => `${c.name}=${c.value}`).join("; ");
      const res = await request.post("/api/integrations/export-task", {
        headers: { Cookie: cookies, "Content-Type": "application/json" },
        data: { title: "test", description: "x", url: "https://example.com", preferred: "asana" },
      });
      // Pro/Agency/Legacy → 200 oder 4xx wegen kein Provider; Starter/null → 401/403
      if (["Professional", "Agency", "Legacy smart-guard → Pro"].includes(p.label)) {
        expect([200, 400, 502]).toContain(res.status()); // 400 = kein Provider verbunden, 502 = Webhook-Fehler — beides "auth ok"
      } else {
        expect([401, 403]).toContain(res.status());
      }
    });
  });
}
```

## Coverage-Matrix

| Persona      | Dashboard-Render | LockedSection × 3 | Action-Bar | Team-Widget | Kunden-Matrix | API /api/team | API /api/integrations/export-task |
|--------------|------------------|-------------------|------------|-------------|---------------|---------------|-----------------------------------|
| starter      | ✓ (single)       | History/Shop locked, GSC hidden | ✗         | ✗           | ✗             | 403           | 403                               |
| professional | ✓ (single)       | History/Shop unlocked, GSC locked | ✓        | ✗           | ✗             | 403           | 200/400                           |
| agency       | ✓ (kommandozentrale) | n/a (kein single-layout)     | ✓ (in scan-detail) | ✓   | ✓             | 200           | 200/400                           |
| legacy (smart-guard) | ✓ (single) | wie professional             | ✓         | ✗           | ✗             | 403           | 200/400                           |
| null         | ✗ (redirect /login) | n/a                          | n/a       | n/a         | n/a           | 401           | 401                               |

## Was diese Tests *nicht* abdecken (für später)

- **Visual-Regression** (Pixel-Vergleich der Lock-Cards / Team-Widget) — bräuchte Snapshot-Tooling.
- **Performance-Budget** (Bundle-Size pro Plan, TTFB) — eigene Suite mit Lighthouse-CI.
- **OAuth-Webhook-Roundtrip** (Asana/Slack tatsächlich gepostet) — bräuchte Webhook-Catcher (z.B. Smee oder Mock-Server).
- **Branding-Override** visuell (CSS-Var-Cascade greift) — ließe sich via Computed-Style-Assertion machen,
  Beispiel: `await expect(page.locator(".some-cta")).toHaveCSS("background-color", brandColor)`.
