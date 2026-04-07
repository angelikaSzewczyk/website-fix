"use client";

export default function BillingPortalButton() {
  async function handleClick() {
    const res = await fetch("/api/billing-portal", { method: "POST", credentials: "include" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else alert(data.error ?? "Fehler beim Öffnen des Kundenportals.");
  }

  return (
    <button onClick={handleClick} style={{
      fontSize: 12, color: "rgba(255,255,255,0.35)", background: "none",
      border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
      cursor: "pointer", padding: "5px 12px",
    }}>
      Abo verwalten
    </button>
  );
}
