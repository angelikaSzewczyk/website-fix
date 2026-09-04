"use client";

import { useEffect, useMemo, useState } from "react";
import { saveScanToStorage } from "@/lib/scan-storage";
import type { DiagnosisFinding } from "@/types/diagnosis";

const VERIFY_KEY = "wf_fix_verification";

type PreviousVerification = {
  url: string;
  findingKeys: string[];
  startedAt: number;
};

export default function FixVerification({
  url,
  findings,
  paid,
}: {
  url: string;
  findings: DiagnosisFinding[];
  paid: boolean;
}) {
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const currentKeys = useMemo(() => findings.map((finding) => finding.key), [findings]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(VERIFY_KEY);
      if (!raw) return;

      const previous = JSON.parse(raw) as PreviousVerification;
      if (previous.url !== url) return;

      sessionStorage.removeItem(VERIFY_KEY);

      const resolved = previous.findingKeys.filter(
        (key) => !currentKeys.includes(key as DiagnosisFinding["key"]),
      );
      const remaining = previous.findingKeys.filter(
        (key) => currentKeys.includes(key as DiagnosisFinding["key"]),
      );

      if (resolved.length > 0 && remaining.length === 0) {
        setMessage(
          `${resolved.length} vorherige ${resolved.length === 1 ? "Befund ist" : "Befunde sind"} im neuen Scan nicht mehr vorhanden.`,
        );
      } else if (resolved.length > 0) {
        setMessage(
          `${resolved.length} ${resolved.length === 1 ? "Befund wurde" : "Befunde wurden"} nicht erneut gefunden · ${remaining.length} weiterhin vorhanden.`,
        );
      } else {
        setMessage(
          "Die zuvor gefundenen Befunde sind im neuen Scan weiterhin vorhanden.",
        );
      }
    } catch {
      sessionStorage.removeItem(VERIFY_KEY);
    }
  }, [currentKeys, url]);

  async function verify() {
    if (!paid || running) return;

    setRunning(true);
    setMessage(null);

    try {
      sessionStorage.setItem(
        VERIFY_KEY,
        JSON.stringify({
          url,
          findingKeys: currentKeys,
          startedAt: Date.now(),
        } satisfies PreviousVerification),
      );

      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, forceRefresh: true }),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        sessionStorage.removeItem(VERIFY_KEY);
        throw new Error(data?.error || "Der Kontrollscan konnte nicht gestartet werden.");
      }

      saveScanToStorage(url, data);
      window.location.href = `/scan/results?url=${encodeURIComponent(url)}&verified=1`;
    } catch (error) {
      setRunning(false);
      setMessage(
        error instanceof Error
          ? error.message
          : "Der Kontrollscan konnte nicht gestartet werden.",
      );
    }
  }

  if (!paid) {
    return (
      <section className="wf-results-verify wf-results-verify-locked">
        <div>
          <span className="wf-results-eyebrow">Fix verifizieren</span>
          <h2>Nach der Änderung erneut prüfen.</h2>
          <p>
            Starter vergleicht einen frischen Kontrollscan mit den vorherigen
            Befunden. So siehst du, ob ein Problem noch vorhanden ist.
          </p>
        </div>
        <a className="wf-results-button-primary" href="#diagnose-vertiefen">
          Mit Starter freischalten →
        </a>
      </section>
    );
  }

  return (
    <section className="wf-results-verify">
      <div>
        <span className="wf-results-eyebrow">Fix verifizieren</span>
        <h2>Änderung gemacht? Jetzt kontrollieren.</h2>
        <p>
          WebsiteFix führt einen frischen Scan ohne Cache durch und vergleicht
          die Befundtypen mit diesem Ergebnis.
        </p>
        {message && <div className="wf-results-verify-message">{message}</div>}
      </div>

      <button
        className="wf-results-button-primary"
        type="button"
        disabled={running}
        onClick={verify}
      >
        {running ? "Kontrollscan läuft…" : "Fix jetzt prüfen →"}
      </button>
    </section>
  );
}
