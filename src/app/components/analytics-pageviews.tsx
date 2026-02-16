// app/components/analytics-pageviews.tsx
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { flushQueue, trackPageView } from "@/lib/track";


type Props = { gaId: string };

export default function AnalyticsPageViews({ gaId }: Props) {
  const pathname = usePathname();

  useEffect(() => {
    // expose flush hook for the loader Script (safe)
    (window as any).__wfFlush = flushQueue;

    if (!gaId) return;

    trackPageView(gaId, pathname);
    flushQueue();
  }, [gaId, pathname]);

  return null;
}
