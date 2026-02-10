"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function AnalyticsPageViews({ gaId }: { gaId: string }) {
  const pathname = usePathname();
  const sp = useSearchParams();

  useEffect(() => {
    const url = pathname + (sp?.toString() ? `?${sp.toString()}` : "");

    if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
      (window as any).gtag("event", "page_view", {
        page_location: window.location.href,
        page_path: url,
        page_title: document.title,
        send_to: gaId,
      });
    }
  }, [pathname, sp, gaId]);

  return null;
}
