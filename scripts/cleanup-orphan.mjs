/**
 * cleanup-orphan.mjs
 * Removes the orphaned Free/Single IIFE body that was left behind after
 * replace-free-dashboard-v3.mjs inserted <FreeDashboardClient />.
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const pagePath = resolve("src/app/dashboard/page.tsx");
let src = readFileSync(pagePath, "utf8");

// The orphaned block starts right after the FreeDashboardClient closing )}
// and ends right before the Agency IIFE comment.
const ORPHAN_START = `      )}

              {/* ⑤ GSC BRIDGE */}`;

const ORPHAN_END_MARKER = `      })()}



      {/* ══════════════════════════════════════════════════════════
          AGENCY LAYOUT`;

const startIdx = src.indexOf(ORPHAN_START);
if (startIdx === -1) {
  console.error("❌ Orphan start not found — aborting");
  process.exit(1);
}

const endIdx = src.indexOf(ORPHAN_END_MARKER, startIdx);
if (endIdx === -1) {
  console.error("❌ Orphan end not found — aborting");
  process.exit(1);
}

// Keep up to and including `      )}\n\n` then jump to just before the Agency comment
const before = src.slice(0, startIdx + "      )}".length);
const after  = src.slice(endIdx + "      })()}".length);

src = before + "\n\n" + after.trimStart();
writeFileSync(pagePath, src, "utf8");
console.log("✅ Orphaned IIFE body removed");
console.log("Done.");
