/**
 * replace-free-dashboard-v3.mjs
 * Replaces the Free/Single IIFE in page.tsx with <FreeDashboardClient ... />
 * and adds the import at the top of the file.
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const pagePath = resolve("src/app/dashboard/page.tsx");
let src = readFileSync(pagePath, "utf8");

// ── 1. Add import after existing imports ──────────────────────────────────────
const IMPORT_ANCHOR = `import { neon } from "@neondatabase/serverless";`;
const NEW_IMPORT    = `import FreeDashboardClient from "./free-dashboard-client";`;

if (!src.includes(NEW_IMPORT)) {
  src = src.replace(IMPORT_ANCHOR, `${IMPORT_ANCHOR}\n${NEW_IMPORT}`);
  console.log("✅ Import added");
} else {
  console.log("ℹ️  Import already present");
}

// ── 2. Replace the IIFE block ─────────────────────────────────────────────────
const START = `      {/* ══════════════════════════════════════════════════════════
          FREE / SINGLE (Smart-Guard) LAYOUT — STRUCTURED LIGHT
          ══════════════════════════════════════════════════════════ */}
      {!isAgency && (() => {`;

// The IIFE ends with })()} — find its position after START
const startIdx = src.indexOf(START);
if (startIdx === -1) {
  console.error("❌ START marker not found — aborting");
  process.exit(1);
}

// Find the closing })()  that belongs to this IIFE
// We look for `})()}` after startIdx
const END_MARKER = "      })()}";
const endIdx = src.indexOf(END_MARKER, startIdx);
if (endIdx === -1) {
  console.error("❌ END marker not found — aborting");
  process.exit(1);
}

const before = src.slice(0, startIdx);
const after  = src.slice(endIdx + END_MARKER.length);

const replacement = `      {/* ══════════════════════════════════════════════════════════
          FREE / SINGLE (Smart-Guard) LAYOUT — PREMIUM DARK
          ══════════════════════════════════════════════════════════ */}
      {!isAgency && (
        <FreeDashboardClient
          firstName={firstName}
          plan={plan}
          lastScan={lastScan}
          lastScanResult={lastScanResult}
          issues={issues}
          redCount={redIssues.length}
          yellowCount={yellowIssues.length}
          rechtIssues={rechtIssues}
          speedIssues={speedIssues}
          techIssues={techIssues}
          cms={cms}
          bfsgOk={bfsgOk}
          speedScore={speedScore}
          scans={scans}
          monthlyScans={monthlyScans}
          scanLimit={SCAN_LIMIT}
        />
      )}`;

src = before + replacement + after;
writeFileSync(pagePath, src, "utf8");
console.log("✅ IIFE replaced with <FreeDashboardClient ... />");
console.log("Done.");
