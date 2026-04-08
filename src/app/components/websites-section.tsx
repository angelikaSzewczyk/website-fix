"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Website = {
  id: string;
  url: string;
  name: string | null;
  last_issue_count: number | null;
  last_scan_at: string | null;
  last_scan_type: string | null;
};

const C = {
  card:      "#FFFFFF",
  border:    "#E2E8F0",
  divider:   "#F1F5F9",
  shadow:    "0 1px 4px rgba(0,0,0,0.07)",
  text:      "#0F172A",
  textSub:   "#475569",
  textMuted: "#94A3B8",
  blue:      "#2563EB",
  blueBg:    "#EFF6FF",
  bg:        "#F8FAFC",
  greenDot:  "#22C55E",
  amberDot:  "#F59E0B",
  redDot:    "#EF4444",
  green:     "#16A34A",
  greenBg:   "#F0FDF4",
  red:       "#DC2626",
  redBg:     "#FEF2F2",
};

export default function WebsitesSection() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [adding, setAdding] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/websites", { credentials: "include" })
      .then(r => r.json())
      .then(d => { setWebsites(d.websites ?? []); setLoading(false); });
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newUrl) return;
    let url = newUrl.trim();
    if (!url.startsWith("http")) url = "https://" + url;
    await fetch("/api/websites", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url, name: newName }) });
    const res = await fetch("/api/websites", { credentials: "include" });
    const data = await res.json();
    setWebsites(data.websites ?? []);
    setNewUrl(""); setNewName(""); setAdding(false);
  }

  async function handleDelete(id: string) {
    await fetch("/api/websites", { method: "DELETE", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setWebsites(w => w.filter(x => x.id !== id));
  }

  const dotColor = (n: number | null) => n === null ? C.textMuted : n === 0 ? C.greenDot : n <= 2 ? C.amberDot : C.redDot;
  const statusText = (n: number | null) => n === null ? "—" : n === 0 ? "OK" : `${n} Issues`;
  const statusColor = (n: number | null) => n === null ? C.textMuted : n === 0 ? C.green : n <= 2 ? "#D97706" : C.red;

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Meine Websites
        </p>
        <button onClick={() => setAdding(a => !a)} style={{
          fontSize: 12, padding: "5px 12px", borderRadius: 8,
          border: `1px solid ${C.border}`, background: C.card,
          color: C.blue, cursor: "pointer", fontWeight: 600,
        }}>
          + Website hinzufügen
        </button>
      </div>

      {adding && (
        <form onSubmit={handleAdd} style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <input
            value={newName} onChange={e => setNewName(e.target.value)}
            placeholder="Name (optional)"
            style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 13, width: 160 }}
          />
          <input
            value={newUrl} onChange={e => setNewUrl(e.target.value)}
            placeholder="https://kunden-website.de" required
            style={{ flex: 1, minWidth: 220, padding: "8px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 13 }}
          />
          <button type="submit" style={{
            padding: "8px 18px", borderRadius: 8, border: "none",
            background: C.blue, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
          }}>
            Speichern
          </button>
        </form>
      )}

      {loading ? (
        <div style={{ fontSize: 13, color: C.textMuted, padding: "16px 0" }}>Lädt...</div>
      ) : websites.length === 0 ? (
        <div style={{
          padding: "24px 20px", background: C.card,
          border: `1px dashed ${C.border}`, borderRadius: 12, textAlign: "center",
        }}>
          <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
            Noch keine Websites gespeichert. Füge deine ersten Kunden-Websites hinzu.
          </p>
        </div>
      ) : (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, boxShadow: C.shadow, overflow: "hidden" }}>
          {websites.map((site, i) => (
            <div key={site.id} style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "13px 18px",
              borderBottom: i < websites.length - 1 ? `1px solid ${C.divider}` : "none",
            }}>
              {/* Status dot */}
              <span style={{
                width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                background: dotColor(site.last_issue_count),
              }} />
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {site.name ?? site.url}
                </div>
                {site.name && (
                  <div style={{ fontSize: 11, color: C.textMuted, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {site.url}
                  </div>
                )}
                {site.last_scan_at && (
                  <div style={{ fontSize: 11, color: C.textMuted, marginTop: 1 }}>
                    Letzter Scan: {new Date(site.last_scan_at).toLocaleDateString("de-DE")}
                  </div>
                )}
              </div>
              {/* Issue count */}
              {site.last_issue_count !== null && (
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 20,
                  color: statusColor(site.last_issue_count),
                  background: site.last_issue_count === 0 ? C.greenBg : site.last_issue_count <= 2 ? "#FFFBEB" : C.redBg,
                  border: `1px solid ${dotColor(site.last_issue_count)}44`,
                  flexShrink: 0,
                }}>
                  {statusText(site.last_issue_count)}
                </span>
              )}
              {/* Scan link */}
              <Link href={`/dashboard/scan?url=${encodeURIComponent(site.url)}`} style={{
                fontSize: 12, padding: "5px 12px", borderRadius: 7, textDecoration: "none",
                border: `1px solid ${C.border}`, color: C.blue,
                background: C.blueBg, whiteSpace: "nowrap", fontWeight: 600,
              }}>
                Scannen →
              </Link>
              {/* Delete */}
              <button onClick={() => handleDelete(site.id)} style={{
                fontSize: 16, background: "none", border: "none", cursor: "pointer",
                color: C.textMuted, padding: "0 4px", lineHeight: 1,
              }}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
