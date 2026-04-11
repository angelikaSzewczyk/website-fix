"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Reads ?checkout=<plan> from the URL after a post-login redirect
 * and immediately fires the Stripe checkout for that plan.
 * Renders nothing visible.
 */
export default function AutoCheckout() {
  const params = useSearchParams();
  const plan = params.get("checkout");

  useEffect(() => {
    if (!plan) return;

    // Remove param from URL without navigation so it doesn't re-fire on refresh
    const url = new URL(window.location.href);
    url.searchParams.delete("checkout");
    window.history.replaceState(null, "", url.toString());

    fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.url) window.location.href = data.url;
      })
      .catch(() => {/* silently fail — user is already on pricing section */});
  }, [plan]);

  return null;
}
