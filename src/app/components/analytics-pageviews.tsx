"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

type Props = { gaId: string };

export default function AnalyticsPageViews({ gaId }: Props) {
  const pathname = usePathname();

  useEffect(() => {
    if (!gaId) return;

    // GA script noch nicht geladen? Dann einfach skippen.
    const gtag = (window as any).gtag;
    if (typeof gtag !== "function") return;

    gtag("config", gaId, {
      page_path: pathname,
    });
  }, [gaId, pathname]);

  return null;
}
