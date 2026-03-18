"use client";
import QuickCheck from "./quick-check";

export default function BlogClientWrapper({ postData }: { postData: any }) {
  return (
    <div style={{ marginTop: '4rem', marginBottom: '4rem' }}>
      {/* Die QuickCheck-Komponente übernimmt nun die gesamte Kontrolle.
        Sobald das Quiz beendet ist, verwandelt sie sich selbst in den Ergebnis-CTA.
      */}
      <QuickCheck />
    </div>
  );
}