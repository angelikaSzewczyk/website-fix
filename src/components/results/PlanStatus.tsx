export default function PlanStatus({
  tier,
}: {
  tier: "anon" | "free" | "paid";
}) {
  if (tier === "paid") {
    return (
      <div className="wf-plan-status" data-tier="paid">
        <span className="wf-plan-status-dot" />
        Vertiefte Diagnose aktiv
      </div>
    );
  }

  if (tier === "free") {
    return (
      <div className="wf-plan-status" data-tier="free">
        Eingeloggt · kostenloser Zugriff
      </div>
    );
  }

  return null;
}
