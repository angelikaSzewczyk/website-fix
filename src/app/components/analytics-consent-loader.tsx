// app/components/analytics-consent-loader.tsx
"use client";

import Script from "next/script";
import { useEffect, useMemo, useState } from "react";
import AnalyticsPageViews from "./analytics-pageviews";
import { getAnalyticsConsent } from "@/lib/track";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-LR9GN3WZJY";

export default function AnalyticsConsentLoader() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    setAllowed(getAnalyticsConsent() === "granted");
  }, []);

  // Listen for consent changes (banner will dispatch this)
  useEffect(() => {
    const onChange = () => setAllowed(getAnalyticsConsent() === "granted");
    window.addEventListener("wf:consent", onChange);
    return () => window.removeEventListener("wf:consent", onChange);
  }, []);

  const canLoad = useMemo(() => allowed && !!GA_ID, [allowed]);

  if (!canLoad) return null;

  return (
    <>
      {/* GA4 library */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />

      {/* GA4 init */}
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;

          gtag('js', new Date());

          // Consent already granted (we only render this loader when granted)
          gtag('consent','update',{
            analytics_storage:'granted',
            ad_storage:'denied',
            ad_user_data:'denied',
            ad_personalization:'denied'
          });

          gtag('config', '${GA_ID}', {
            anonymize_ip: true,
            send_page_view: false
          });
        `}
      </Script>

      {/* SPA page views */}
      <AnalyticsPageViews gaId={GA_ID} />

      {/* Flush queued events once GA is ready */}
      <Script id="ga4-flush" strategy="afterInteractive">
        {`window.setTimeout(function(){ try { window.__wfFlush && window.__wfFlush(); } catch(e){} }, 0);`}
      </Script>
    </>
  );
}
