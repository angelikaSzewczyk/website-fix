"use client";

import { useEffect, useRef, useState } from "react";
import { saveScanToStorage } from "@/lib/scan-storage";
import {
  FREE_SCAN_LIMIT_MS,
  formatTimeRemaining as fmtScanGate,
  isScanBlocked,
  recordRateLimit,
  recordScan,
} from "@/lib/scan-gate";

type ScanPhase = "idle" | "scanning" | "done" | "error" | "not_wordpress";
type ScanStage = "discovering" | "scanning" | "consolidating";

function getHostname(input: string): string {
  try {
    const value = input.startsWith("http") ? input : `https://${input}`;
    return new URL(value).hostname;
  } catch {
    return input;
  }
}

export default function InlineScan({
  placeholder = "https://deine-website.de",
}: {
  placeholder?: string;
}) {
  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState<ScanPhase>("idle");
  const [stage, setStage] = useState<ScanStage>("discovering");
  const [error, setError] = useState("");
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [scanBlocked, setScanBlocked] = useState({
    blocked: false,
    nextMs: 0,
  });
  const [timeRemaining, setTimeRemaining] = useState("");
  const [mounted, setMounted] = useState(false);

  const runIdRef = useRef(0);
  const scanFinishedRef = useRef(false);

  useEffect(() => {
    const gate = isScanBlocked();
    if (gate.blocked) {
      setScanBlocked({ blocked: true, nextMs: gate.nextMs });
      setTimeRemaining(fmtScanGate(gate.nextMs));
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!scanBlocked.blocked) return;

    const id = setInterval(() => {
      const remaining = scanBlocked.nextMs - Date.now();

      if (remaining <= 0) {
        setScanBlocked({ blocked: false, nextMs: 0 });
        clearInterval(id);
        return;
      }

      setTimeRemaining(fmtScanGate(scanBlocked.nextMs));
    }, 1000);

    return () => clearInterval(id);
  }, [scanBlocked]);

  function reset() {
    runIdRef.current += 1;
    scanFinishedRef.current = false;
    setPhase("idle");
    setStage("discovering");
    setError("");
    setPageCount(null);
  }

  async function handleScan(event: React.FormEvent) {
    event.preventDefault();

    const cleanUrl = url.trim();
    if (!cleanUrl || phase === "scanning") return;

    const gate = isScanBlocked(cleanUrl);
    if (gate.blocked) {
      setScanBlocked({ blocked: true, nextMs: gate.nextMs });
      setTimeRemaining(fmtScanGate(gate.nextMs));
      return;
    }

    const runId = ++runIdRef.current;
    scanFinishedRef.current = false;

    setPhase("scanning");
    setStage("discovering");
    setError("");
    setPageCount(null);

    // Discovery und eigentlicher Scan starten parallel.
    // Wichtig: Die UI zeigt nur Zustände, die wir wirklich kennen.
    const discoverPromise = fetch("/api/scan/discover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: cleanUrl }),
    })
      .then((response) => response.json())
      .then((data: { urls?: string[]; count?: number }) => {
        if (runId !== runIdRef.current || scanFinishedRef.current) return;

        const discovered =
          typeof data.count === "number"
            ? data.count
            : Array.isArray(data.urls)
              ? data.urls.length
              : 0;

        // +1 = Startseite
        setPageCount(Math.max(1, discovered + 1));
        setStage("scanning");
      })
      .catch(() => {
        if (runId !== runIdRef.current || scanFinishedRef.current) return;
        setPageCount(null);
        setStage("scanning");
      });

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: cleanUrl }),
      });

      const data = await response.json();

      if (runId !== runIdRef.current) return;

      if (data.success) {
        scanFinishedRef.current = true;
        setStage("consolidating");

        recordScan(cleanUrl);
        saveScanToStorage(cleanUrl, data);

        // Nur ein kurzer Zustandswechsel, keine künstlich verlängerte Animation.
        setTimeout(() => {
          if (runId !== runIdRef.current) return;
          setPhase("done");

          setTimeout(() => {
            window.location.href = `/scan/results?url=${encodeURIComponent(cleanUrl)}`;
          }, 350);
        }, 250);

        return;
      }

      scanFinishedRef.current = true;

      if (
        data.errorCode === "RATE_LIMITED" ||
        data.errorCode === "RATE_LIMIT"
      ) {
        const now = Date.now();
        const nextMs =
          data.retryAfterMs
            ? now + data.retryAfterMs
            : now + FREE_SCAN_LIMIT_MS;

        recordRateLimit(cleanUrl, nextMs);
        setPhase("idle");
        setScanBlocked({ blocked: true, nextMs });
        setTimeRemaining(fmtScanGate(nextMs));
        return;
      }

      if (data.errorCode === "ERR_NOT_WORDPRESS") {
        setPhase("not_wordpress");
        return;
      }

      if (data.errorCode === "SITE_UNREACHABLE") {
        setError(
          "Die Website konnte nicht erfolgreich abgerufen werden. Prüfe URL, DNS und Erreichbarkeit.",
        );
        setPhase("error");
        return;
      }

      setError(data.error ?? "Der Scan konnte nicht abgeschlossen werden.");
      setPhase("error");
    } catch {
      if (runId !== runIdRef.current) return;
      scanFinishedRef.current = true;
      setError("Verbindungsfehler. Bitte versuche den Scan erneut.");
      setPhase("error");
    } finally {
      void discoverPromise;
    }
  }

  const steps = [
    {
      title: "Seitenstruktur erfassen",
      detail: "Sitemap und interne Links werden geprüft.",
      state:
        stage === "discovering"
          ? "active"
          : "done",
    },
    {
      title: "Technische Signale prüfen",
      detail:
        pageCount !== null
          ? `${pageCount} URL-Vorkommen entdeckt · daraus wählt WebsiteFix die Seiten für den technischen Check.`
          : "HTTP, Indexierung, Seitendaten, Links und Zugänglichkeit werden geprüft.",
      state:
        stage === "discovering"
          ? "pending"
          : stage === "scanning"
            ? "active"
            : "done",
    },
    {
      title: "Befunde priorisieren",
      detail: "Messwerte werden zu nachvollziehbaren Befunden zusammengeführt.",
      state: stage === "consolidating" ? "active" : "pending",
    },
  ] as const;

  if (!mounted) {
    return <div className="wf-scan-v2-mount" />;
  }

  if (scanBlocked.blocked && phase === "idle") {
    return (
      <div className="wf-scan-v2-notice">
        <div>
          <strong>Dieser kostenlose Scan wurde bereits verwendet.</strong>
          <p>
            Für dieselbe URL ist der nächste Gast-Scan in {timeRemaining} möglich.
          </p>
        </div>
        <div className="wf-scan-v2-notice-actions">
          <a href="/login">Anmelden</a>
          <a href="/#pricing" className="wf-scan-v2-primary-link">
            Pläne ansehen →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="wf-scan-v2">
      {phase !== "scanning" && phase !== "done" && (
        <form onSubmit={handleScan}>
          <label htmlFor="inline-scan-url" className="sr-only">
            Website-URL eingeben
          </label>

          <div className="wf-scan-form">
            <svg
              className="wf-scan-lock-icon"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>

            <input
              id="inline-scan-url"
              type="text"
              inputMode="url"
              autoComplete="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder={placeholder}
              className="wf-scan-input"
            />

            <button
              type="submit"
              disabled={!url.trim()}
              className="wf-scan-btn"
            >
              Website prüfen
              <span aria-hidden="true">→</span>
            </button>
          </div>

          <div className="wf-scan-meta">
            <span>Kostenloser Erstcheck</span>
            <span className="wf-scan-meta-dot" />
            <span>Kein Login erforderlich</span>
            <span className="wf-scan-meta-dot" />
            <span>Keine Änderungen an deiner Website</span>
          </div>
        </form>
      )}

      {phase === "scanning" && (
        <section className="wf-scan-v2-progress" aria-live="polite">
          <header>
            <div>
              <span className="wf-scan-v2-running-dot" aria-hidden="true" />
              <strong>{getHostname(url)}</strong>
            </div>
            <span>Scan läuft</span>
          </header>

          <div className="wf-scan-v2-steps">
            {steps.map((step) => (
              <div
                key={step.title}
                className="wf-scan-v2-step"
                data-state={step.state}
              >
                <span className="wf-scan-v2-step-marker" aria-hidden="true">
                  {step.state === "done" ? "✓" : ""}
                </span>

                <div>
                  <strong>{step.title}</strong>
                  <p>{step.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="wf-scan-v2-footnote">
            Gefundene Seiten und tatsächlich geprüfte Seiten werden im Ergebnis
            getrennt ausgewiesen. Der kostenlose Check analysiert nur einen
            begrenzten Teil größerer Websites.
          </p>
        </section>
      )}

      {phase === "done" && (
        <div className="wf-scan-v2-done">
          <span aria-hidden="true">✓</span>
          <div>
            <strong>Scan abgeschlossen</strong>
            <p>Ergebnisse werden geöffnet.</p>
          </div>
        </div>
      )}

      {phase === "error" && (
        <div className="wf-scan-v2-error">
          <div>
            <strong>Scan nicht abgeschlossen</strong>
            <p>{error}</p>
          </div>
          <button type="button" onClick={reset}>
            Erneut versuchen
          </button>
        </div>
      )}

      {phase === "not_wordpress" && (
        <div className="wf-scan-v2-notice">
          <div>
            <strong>Kein WordPress erkannt</strong>
            <p>
              WebsiteFix V2 ist derzeit auf WordPress-Diagnosen fokussiert.
              Diese Website wurde deshalb nicht weiter analysiert.
            </p>
          </div>
          <button type="button" onClick={reset}>
            Andere Website prüfen
          </button>
        </div>
      )}
    </div>
  );
}
