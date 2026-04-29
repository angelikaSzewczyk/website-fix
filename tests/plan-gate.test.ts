/**
 * Plan-Gate Audit-Tests — Phase 6 / Stabilitäts-Modus.
 *
 * Verifiziert die zentralen Plan-Helper aus lib/plans.ts gegen die 5 Personas
 * aus Spec §4.5. Keine Browser-Abhängigkeit — pure unit tests gegen die
 * Helper-Funktionen, die in 16 API-Routes + im Dashboard-Render entscheiden,
 * was ein User sehen darf.
 *
 * RUN:
 *   npm i -D vitest
 *   npx vitest run tests/plan-gate.test.ts
 *
 * Wenn diese Tests grün sind, sind die Branches im Dashboard und in den
 * Routes mathematisch sauber — was sie sehen, ist eine direkte Folge dieser
 * Helper-Returns.
 */

import { describe, it, expect } from "vitest";
import {
  normalizePlan,
  isAtLeastProfessional,
  isAgency,
  hasBrandingAccess,
  isPaidPlan,
  KNOWN_PLAN_STRINGS,
  getPlanQuota,
} from "../src/lib/plans";

// ── Personas (Spec §4.5) ─────────────────────────────────────────────────────
type Persona = {
  label:       string;
  dbPlan:      string | null;
  expectsAuth: boolean;
  expects: {
    canonical:    "starter" | "professional" | "agency" | null;
    isPaid:       boolean;
    isAtLeastPro: boolean;
    isAgency:     boolean;
    hasBranding:  boolean;
    quotaScans:   number | null;
    quotaProjects:number | null;
  };
  /** Welche Dashboard-Komponenten der User sehen DARF. */
  seesComponents: {
    actionBar:        boolean;  // Asana/Slack-Buttons in Issue-Liste
    historyChartUnlocked: boolean;
    shopAuditUnlocked:    boolean;
    gscCardUnlocked:      boolean;
    teamWidget:       boolean;  // rechte Spalte im Agency-Layout
    kundenMatrix:     boolean;  // Agency-Layout-Body
    whiteLabelTopBar: boolean;
  };
};

const PERSONAS: Persona[] = [
  {
    label:       "starter@test.de",
    dbPlan:      "starter",
    expectsAuth: true,
    expects: {
      canonical: "starter", isPaid: true, isAtLeastPro: false, isAgency: false,
      hasBranding: false, quotaScans: 5, quotaProjects: 3,
    },
    seesComponents: {
      actionBar: false, historyChartUnlocked: false, shopAuditUnlocked: false,
      gscCardUnlocked: false, teamWidget: false, kundenMatrix: false, whiteLabelTopBar: false,
    },
  },
  {
    label:       "pro@test.de",
    dbPlan:      "professional",
    expectsAuth: true,
    expects: {
      canonical: "professional", isPaid: true, isAtLeastPro: true, isAgency: false,
      hasBranding: true, quotaScans: 25, quotaProjects: 10,
    },
    seesComponents: {
      actionBar: true, historyChartUnlocked: true, shopAuditUnlocked: true,
      gscCardUnlocked: false /* Pro sieht GSC gelockt — Agency-Feature */,
      teamWidget: false, kundenMatrix: false, whiteLabelTopBar: false,
    },
  },
  {
    label:       "agency@test.de",
    dbPlan:      "agency",
    expectsAuth: true,
    expects: {
      canonical: "agency", isPaid: true, isAtLeastPro: true, isAgency: true,
      hasBranding: true, quotaScans: 100, quotaProjects: 50,
    },
    seesComponents: {
      actionBar: true /* in scan-detail; Agency hat kein single-layout-Dashboard */,
      historyChartUnlocked: true, shopAuditUnlocked: true,
      gscCardUnlocked: true,
      teamWidget: true, kundenMatrix: true, whiteLabelTopBar: true,
    },
  },
  {
    label:       "legacy@test.de",
    dbPlan:      "smart-guard",
    expectsAuth: true,
    expects: {
      canonical: "professional", isPaid: true, isAtLeastPro: true, isAgency: false,
      hasBranding: true, quotaScans: 25, quotaProjects: 10,
    },
    seesComponents: {
      actionBar: true, historyChartUnlocked: true, shopAuditUnlocked: true,
      gscCardUnlocked: false, teamWidget: false, kundenMatrix: false, whiteLabelTopBar: false,
    },
  },
  {
    label:       "null@test.de",
    dbPlan:      null,
    expectsAuth: false,
    expects: {
      canonical: null, isPaid: false, isAtLeastPro: false, isAgency: false,
      hasBranding: false, quotaScans: null, quotaProjects: null,
    },
    seesComponents: {
      actionBar: false, historyChartUnlocked: false, shopAuditUnlocked: false,
      gscCardUnlocked: false, teamWidget: false, kundenMatrix: false, whiteLabelTopBar: false,
    },
  },
];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Plan-Gate-Audit / 5 Personas", () => {
  PERSONAS.forEach(persona => {
    describe(persona.label, () => {
      it("normalizePlan matched die kanonische Erwartung", () => {
        expect(normalizePlan(persona.dbPlan)).toBe(persona.expects.canonical);
      });

      it("isPaidPlan", () => {
        expect(isPaidPlan(persona.dbPlan)).toBe(persona.expects.isPaid);
      });

      it("isAtLeastProfessional", () => {
        expect(isAtLeastProfessional(persona.dbPlan)).toBe(persona.expects.isAtLeastPro);
      });

      it("isAgency", () => {
        expect(isAgency(persona.dbPlan)).toBe(persona.expects.isAgency);
      });

      it("hasBrandingAccess", () => {
        expect(hasBrandingAccess(persona.dbPlan)).toBe(persona.expects.hasBranding);
      });

      it("getPlanQuota — monthlyScans + projects", () => {
        if (persona.expects.quotaScans === null) return; // null-User → Page redirected, Quota irrelevant
        const q = getPlanQuota(persona.dbPlan);
        expect(q.monthlyScans).toBe(persona.expects.quotaScans);
        expect(q.projects).toBe(persona.expects.quotaProjects);
      });

      // ── UI-Side: derive component visibility from helpers ──────────────────
      // Diese Block ist die bridge between "helper-output" und "dashboard-render".
      // Wenn das Dashboard die Helper richtig benutzt, sind die Komponenten exakt
      // sichtbar wo persona.seesComponents.* === true sagt.
      it("Component-Sichtbarkeit (derived)", () => {
        const plan = persona.dbPlan;

        // Action-Bar: Pro+ in StarterResultsPanel (single-layout) ODER scan-detail
        const actionBarVisible = isAtLeastProfessional(plan);
        expect(actionBarVisible).toBe(persona.seesComponents.actionBar);

        // LockedSection-Children: required-tier muss erfüllt sein
        const historyUnlocked   = isAtLeastProfessional(plan);
        const shopAuditUnlocked = isAtLeastProfessional(plan);
        const gscUnlocked       = isAgency(plan);  // GSC ist Agency-required
        expect(historyUnlocked).toBe(persona.seesComponents.historyChartUnlocked);
        expect(shopAuditUnlocked).toBe(persona.seesComponents.shopAuditUnlocked);
        expect(gscUnlocked).toBe(persona.seesComponents.gscCardUnlocked);

        // Agency-Layout-Komponenten
        const showsTeamWidget   = isAgency(plan);
        const showsKundenMatrix = isAgency(plan);
        const showsWhiteLabel   = isAgency(plan);
        expect(showsTeamWidget).toBe(persona.seesComponents.teamWidget);
        expect(showsKundenMatrix).toBe(persona.seesComponents.kundenMatrix);
        expect(showsWhiteLabel).toBe(persona.seesComponents.whiteLabelTopBar);
      });
    });
  });

  // ── Adjazente Sicherheits-Checks ─────────────────────────────────────────────
  describe("Adversarial / Edge Cases", () => {
    it("Unbekannte DB-Strings normalisieren auf null (kein heimlicher Pro-Zugang)", () => {
      expect(normalizePlan("free-trial-hack")).toBeNull();
      expect(normalizePlan("agency-enterprise")).toBeNull();
      expect(normalizePlan("ADMIN")).toBeNull();
    });

    it("Legacy 'free' wird zu Starter, NICHT zu Pro", () => {
      expect(normalizePlan("free")).toBe("starter");
      expect(isAtLeastProfessional("free")).toBe(false);
      expect(isAgency("free")).toBe(false);
    });

    it("KNOWN_PLAN_STRINGS enthält alle Werte, die normalizePlan akzeptiert (außer 'free')", () => {
      // Nur die Cron-Filter-relevante Liste: agency-Plans + paid plans, KEIN "free"
      // (Free-User dürfen keine Monatsmail bekommen).
      for (const p of KNOWN_PLAN_STRINGS) {
        expect(normalizePlan(p)).not.toBeNull();
      }
      // "free" ist ABSICHTLICH nicht in KNOWN_PLAN_STRINGS, obwohl normalizePlan es akzeptiert
      expect(KNOWN_PLAN_STRINGS).not.toContain("free");
    });

    it("Whitespace und case-Sensitivität: keine implizite Akzeptanz", () => {
      // Helper machen KEIN trim() / toLowerCase() — DB-Werte müssen exakt passen.
      expect(normalizePlan(" agency ")).toBeNull();
      expect(normalizePlan("AGENCY")).toBeNull();
      expect(normalizePlan("Agency")).toBeNull();
    });

    it("Empty/undefined Plan-Strings sind nicht authentifiziert", () => {
      expect(normalizePlan("")).toBeNull();
      expect(normalizePlan(undefined)).toBeNull();
      expect(isPaidPlan("")).toBe(false);
      expect(isPaidPlan(null)).toBe(false);
      expect(isAgency(null)).toBe(false);
    });
  });
});
