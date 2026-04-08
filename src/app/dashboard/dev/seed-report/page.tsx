"use client";

import { useState, useTransition } from "react";
import { seedReportData, deleteSeedData, type SeedResult } from "./actions";

export default function SeedReportPage() {
  const [result,     setResult]     = useState<SeedResult | null>(null);
  const [isPending,  startSeed]     = useTransition();
  const [isDeleting, startDelete]   = useTransition();

  function handleSeed() {
    startSeed(async () => {
      const r = await seedReportData();
      setResult(r);
    });
  }

  function handleDelete() {
    startDelete(async () => {
      await deleteSeedData();
    });
  }

  return (
    <main style={{ maxWidth: 680, margin: "0 auto", padding: "60px 24px" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6,
          background: "rgba(255,107,107,0.1)", color: "#ff6b6b",
          border: "1px solid rgba(255,107,107,0.2)", letterSpacing: "0.1em",
        }}>
          DEV ONLY
        </span>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "12px 0 6px", letterSpacing: "-0.02em" }}>
          Report-Seed: Müller &amp; Söhne Sanitär
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
          Erstellt einen vollständigen Test-Kunden mit 30 Tagen Verlaufsdaten
          für den Value-Report-Generator. Einmalig ausführen, danach löschen.
        </p>
      </div>

      {/* What gets created */}
      <div style={{
        marginBottom: 28, padding: "18px 20px", borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)",
      }}>
        <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Wird erstellt
        </p>
        {[
          ["saved_websites",  "1 Website — Müller & Söhne Sanitär (https://mueller-soehne-sanitaer.de)"],
          ["website_checks",  "50 Einträge — 30 Tage, 96% Uptime, Response 200–1200ms, 2 Ausfälle"],
          ["activity_logs",   "7 Einträge — 2× KI-Fix, 2× Jira-Ticket, 1× Alert, 2× Scan-Completed"],
          ["scans",           "3 Einträge — WCAG (7 Issues), Performance (3), Website-Check (2)"],
        ].map(([table, desc]) => (
          <div key={table} style={{ display: "flex", gap: 12, marginBottom: 8, alignItems: "baseline" }}>
            <code style={{
              fontSize: 11, padding: "1px 7px", borderRadius: 4, flexShrink: 0,
              background: "rgba(122,166,255,0.1)", color: "#7aa6ff",
              border: "1px solid rgba(122,166,255,0.15)",
            }}>
              {table}
            </code>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{desc}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
        <button
          onClick={handleSeed}
          disabled={isPending}
          style={{
            padding: "11px 28px", borderRadius: 9, fontSize: 14, fontWeight: 700,
            background: isPending ? "rgba(255,255,255,0.08)" : "linear-gradient(90deg,#8df3d3,#7aa6ff)",
            color: isPending ? "rgba(255,255,255,0.3)" : "#0b0c10",
            border: "none", cursor: isPending ? "not-allowed" : "pointer",
          }}
        >
          {isPending ? "Wird erstellt…" : "Seed-Daten erstellen →"}
        </button>

        <button
          onClick={handleDelete}
          disabled={isDeleting}
          style={{
            padding: "11px 22px", borderRadius: 9, fontSize: 14,
            background: "none", color: isDeleting ? "rgba(255,107,107,0.3)" : "#ff6b6b",
            border: "1px solid rgba(255,107,107,0.25)", cursor: isDeleting ? "not-allowed" : "pointer",
          }}
        >
          {isDeleting ? "Löscht…" : "Seed-Daten löschen"}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div style={{
          padding: "18px 20px", borderRadius: 12,
          border: result.ok
            ? "1px solid rgba(141,243,211,0.25)"
            : "1px solid rgba(255,107,107,0.25)",
          background: result.ok
            ? "rgba(141,243,211,0.04)"
            : "rgba(255,107,107,0.04)",
        }}>
          {result.error ? (
            <p style={{ margin: 0, fontSize: 14, color: "#ff6b6b" }}>
              Fehler: {result.error}
            </p>
          ) : result.skipped ? (
            <>
              <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: "#ffd93d" }}>
                Bereits vorhanden — kein Duplikat erstellt.
              </p>
              <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
                Website-ID: <code style={{ color: "#7aa6ff" }}>{result.websiteId}</code>
              </p>
            </>
          ) : (
            <>
              <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "#8df3d3" }}>
                Seed erfolgreich!
              </p>
              {[
                ["Website-ID",      result.websiteId],
                ["website_checks",  `${result.checks} Einträge`],
                ["activity_logs",   `${result.logs} Einträge`],
                ["scans",           `${result.scans} Einträge`],
              ].map(([label, val]) => (
                <div key={label} style={{ display: "flex", gap: 10, marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", width: 130, flexShrink: 0 }}>{label}</span>
                  <code style={{ fontSize: 12, color: "#fff" }}>{val}</code>
                </div>
              ))}
              <p style={{ margin: "16px 0 0", fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
                Öffne jetzt <a href="/dashboard/reports" style={{ color: "#7aa6ff" }}>/dashboard/reports</a> und wähle
                &quot;Müller &amp; Söhne Sanitär&quot; im Report-Generator.
              </p>
            </>
          )}
        </div>
      )}

      {/* Reminder to delete */}
      <p style={{ marginTop: 32, fontSize: 12, color: "rgba(255,255,255,0.2)", lineHeight: 1.6 }}>
        Diese Seite nach dem Test entfernen:{" "}
        <code style={{ color: "rgba(255,255,255,0.35)" }}>
          src/app/dashboard/dev/seed-report/
        </code>
      </p>
    </main>
  );
}
