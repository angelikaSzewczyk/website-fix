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

  const issueColor = (n: number | null) => n === null ? "rgba(255,255,255,0.3)" : n === 0 ? "#8df3d3" : n <= 2 ? "#ffd93d" : "#ff6b6b";

  return (
    <div style={{ marginBottom: 52 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 650, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
          Meine Websites
        </p>
        <button onClick={() => setAdding(a => !a)} style={{
          fontSize: 12, padding: "5px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)",
          background: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer",
        }}>
          + Website hinzufügen
        </button>
      </div>

      {adding && (
        <form onSubmit={handleAdd} style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Name (optional)" style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 13, width: 160 }} />
          <input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://kunden-website.de" required style={{ flex: 1, minWidth: 220, padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 13 }} />
          <button type="submit" style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#8df3d3", color: "#0b0c10", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Speichern</button>
        </form>
      )}

      {loading ? (
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", padding: "16px 0" }}>Lädt...</div>
      ) : websites.length === 0 ? (
        <div style={{ padding: "24px 20px", background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.07)", borderRadius: 12, textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.3)" }}>Noch keine Websites gespeichert. Füge deine ersten Kunden-Websites hinzu.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {websites.map(site => (
            <div key={site.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 18px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {site.name ?? site.url}
                </div>
                {site.name && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{site.url}</div>}
                {site.last_scan_at && (
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>
                    Letzter Scan: {new Date(site.last_scan_at).toLocaleDateString("de-DE")}
                  </div>
                )}
              </div>
              {site.last_issue_count !== null && (
                <div style={{ padding: "3px 10px", borderRadius: 16, fontSize: 12, fontWeight: 600, color: issueColor(site.last_issue_count), border: `1px solid ${issueColor(site.last_issue_count)}30`, background: `${issueColor(site.last_issue_count)}10`, whiteSpace: "nowrap" }}>
                  {site.last_issue_count === 0 ? "✓ OK" : `${site.last_issue_count} Probleme`}
                </div>
              )}
              <Link href={`/dashboard/scan?url=${encodeURIComponent(site.url)}`} style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, textDecoration: "none", border: "1px solid rgba(141,243,211,0.2)", color: "#8df3d3", background: "rgba(141,243,211,0.05)", whiteSpace: "nowrap" }}>
                Neu scannen
              </Link>
              <button onClick={() => handleDelete(site.id)} style={{ fontSize: 16, background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.2)", padding: "0 4px" }}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
