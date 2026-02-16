// app/lib/track.ts
type Params = Record<string, any>;

const CONSENT_KEY = "wf_consent_analytics"; // "granted" | "denied" | undefined

function hasConsent() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(CONSENT_KEY) === "granted";
}

function getGtag(): ((...args: any[]) => void) | null {
  if (typeof window === "undefined") return null;
  const gtag = (window as any).gtag;
  return typeof gtag === "function" ? gtag : null;
}

function getQueue(): Array<{ event: string; params?: Params }> {
  if (typeof window === "undefined") return [];
  const w = window as any;
  if (!w.__wfEventQueue) w.__wfEventQueue = [];
  return w.__wfEventQueue as Array<{ event: string; params?: Params }>;
}

export function getAnalyticsConsent(): "granted" | "denied" | "unset" {
  if (typeof window === "undefined") return "unset";
  const v = localStorage.getItem(CONSENT_KEY);
  if (v === "granted" || v === "denied") return v;
  return "unset";
}

export function setAnalyticsConsent(granted: boolean) {
  if (typeof window === "undefined") return;

  localStorage.setItem(CONSENT_KEY, granted ? "granted" : "denied");

  // If gtag already exists, update consent mode too
  const gtag = getGtag();
  if (gtag) {
    gtag("consent", "update", {
      analytics_storage: granted ? "granted" : "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
  }

  if (granted) flushQueue();
}

export function flushQueue() {
  if (typeof window === "undefined") return;
  if (!hasConsent()) return;

  const gtag = getGtag();
  if (!gtag) return;

  const q = getQueue();
  while (q.length) {
    const item = q.shift();
    if (!item) break;
    gtag("event", item.event, item.params || {});
  }
}

export function track(event: string, params?: Params) {
  if (typeof window === "undefined") return;

  // If no consent: queue (optional) – so if user accepts later, it can flush.
  if (!hasConsent()) {
    getQueue().push({ event, params });
    return;
  }

  const gtag = getGtag();
  if (!gtag) {
    getQueue().push({ event, params });
    return;
  }

  gtag("event", event, params || {});
}

export function trackPageView(gaId: string, page_path: string) {
  if (typeof window === "undefined") return;
  if (!hasConsent()) return;

  const gtag = getGtag();
  if (!gtag) return;

  // send SPA pageview (send_page_view is false in config)
  gtag("config", gaId, { page_path });
}
