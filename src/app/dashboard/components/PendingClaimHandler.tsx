"use client";

/**
 * PendingClaimHandler — Auto-Claim eines anonym vorab gescannten Reports.
 *
 * Hintergrund: Wenn ein User anonym einen Pay-per-Fix-Guide kauft, hat
 * /scan/checkout/claim seinen StoredScan aus dem sessionStorage in den
 * `wf_pending_anon_claim`-Key in localStorage geschrieben. Sobald der User
 * sein Passwort gesetzt hat und im Dashboard landet, fängt diese Komponente
 * den Eintrag ab und ruft /api/scan/claim — der Scan wird dem frischen
 * Account angehängt, der User sieht ihn in seiner Scan-Historie.
 *
 * Idempotent: /api/scan/claim findet bereits-vorhandene Scans (gleiche URL +
 * user_id) und antwortet mit `duplicate: true` ohne Insert. Wir können also
 * gefahrlos jedes Mal feuern. Bei Erfolg räumen wir localStorage auf.
 *
 * Failure-Mode: Network-Error → localStorage bleibt → nächster Mount
 * versucht es erneut. Auth-Fail (401) → User ist nicht eingeloggt, was im
 * Dashboard nicht passieren sollte; trotzdem stumm.
 */

import { useEffect } from "react";

const PENDING_KEY = "wf_pending_anon_claim";

type PendingScanShape = {
  url:                  string;
  diagnose?:            string;
  issueCount?:          number;
  techFingerprint?:     unknown;
  unterseiten?:         unknown[];
  totalPages?:          number | null;
  altMissingCount?:     number;
  brokenLinksCount?:    number;
  duplicateTitlesCount?:number;
  duplicateMetasCount?: number;
  hasUnreachable?:      boolean;
  orphanedPagesCount?:  number;
  https?:               boolean;
  hasTitle?:            boolean;
  hasMeta?:             boolean;
  hasH1?:               boolean;
  hasSitemap?:          boolean;
  robotsBlocked?:       boolean;
  noIndex?:             boolean;
};

export default function PendingClaimHandler() {
  useEffect(() => {
    let cancelled = false;
    try {
      const raw = localStorage.getItem(PENDING_KEY);
      if (!raw) return;
      let parsed: PendingScanShape | null = null;
      try { parsed = JSON.parse(raw) as PendingScanShape; } catch { /* corrupt */ }
      if (!parsed?.url) {
        // Kaputter Eintrag — direkt löschen, kein Retry-Loop
        localStorage.removeItem(PENDING_KEY);
        return;
      }

      fetch("/api/scan/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(parsed),
      })
        .then(r => r.json())
        .then(data => {
          if (cancelled) return;
          if (data?.ok) {
            // Erfolgreich angehängt (oder duplicate=true) → localStorage cleanen
            try { localStorage.removeItem(PENDING_KEY); } catch { /* ignore */ }
          }
          // Bei error: lassen wir den Eintrag stehen, nächster Mount versucht erneut
        })
        .catch(() => { /* network error — retry beim nächsten mount */ });
    } catch { /* localStorage unavailable / private mode */ }

    return () => { cancelled = true; };
  }, []);

  return null;
}
