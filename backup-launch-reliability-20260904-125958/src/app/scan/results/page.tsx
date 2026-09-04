"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import BrandLogo from "../../components/BrandLogo";
import MobileNav from "../../components/MobileNav";
import SiteFooter from "../../components/SiteFooter";
import PsiButton from "./PsiButton";

import {
  loadScanFromStorage,
  saveScanToStorage,
  type StoredScan,
} from "@/lib/scan-storage";
import { normalizePlan } from "@/lib/plans";
import { buildDiagnosis } from "@/lib/diagnosis/build-findings";
import type { RawScanEvidence } from "@/types/diagnosis";

import DiagnosisHeader from "@/components/results/DiagnosisHeader";
import PrimaryFinding from "@/components/results/PrimaryFinding";
import FindingList from "@/components/results/FindingList";
import TechnicalContext from "@/components/results/TechnicalContext";
import AffectedPages from "@/components/results/AffectedPages";
import UnlockDiagnosis from "@/components/results/UnlockDiagnosis";
import ScanScopeSummary from "@/components/results/ScanScopeSummary";
import FixVerification from "@/components/results/FixVerification";

function trackCta(event: string, location: string): void {
  if (typeof window === "undefined") return;

  const win = window as unknown as {
    plausible?: (
      event: string,
      options?: { props?: Record<string, string> },
    ) => void;
    gtag?: (
      command: string,
      event: string,
      params?: Record<string, string>,
    ) => void;
  };

  try {
    win.plausible?.(event, { props: { location } });
    win.gtag?.(
      "event",
      event.toLowerCase().replace(/\s+/g, "_"),
      { location },
    );
  } catch {
    // Analytics darf die Results-Seite nie blockieren.
  }
}

function ResultsInner() {
  const params = useSearchParams();
  const urlParam = params.get("url") ?? "";

  const [scan, setScan] = useState<StoredScan | null>(null);
  const [rawEvidence, setRawEvidence] = useState<RawScanEvidence | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [scanMissing, setScanMissing] = useState(false);
  const [userTier, setUserTier] = useState<"anon" | "free" | "paid">("anon");

  useEffect(() => {
    const normalizeUrl = (value: string) =>
      value
        .replace(/^https?:\/\//, "")
        .replace(/\/$/, "")
        .toLowerCase();

    const stored = loadScanFromStorage();

    if (
      stored &&
      (!urlParam || normalizeUrl(stored.url) === normalizeUrl(urlParam))
    ) {
      setScan(stored);
      setLoaded(true);
      return;
    }

    if (!urlParam) {
      setLoaded(true);
      return;
    }

    fetch(`/api/scan/cached?url=${encodeURIComponent(urlParam)}`)
      .then((response) => response.json())
      .then(
        (cached: {
          found: boolean;
          scanData?: unknown;
          diagnose?: string;
        }) => {
          if (!cached.found || !cached.scanData) {
            setScanMissing(true);
            return;
          }

          saveScanToStorage(urlParam, {
            scanData: cached.scanData as never,
            diagnose: cached.diagnose,
          });

          const restored = loadScanFromStorage();

          if (restored) {
            setScan(restored);
          } else {
            setScanMissing(true);
          }
        },
      )
      .catch(() => setScanMissing(true))
      .finally(() => setLoaded(true));
  }, [urlParam]);

  useEffect(() => {
    if (!urlParam) return;

    // Raw audit evidence is fetched separately from StoredScan so the presentation
    // model stays small while V2 can still show exact broken-link evidence.
    fetch(`/api/scan/cached?url=${encodeURIComponent(urlParam)}`)
      .then((response) => response.json())
      .then((cached: { found?: boolean; scanData?: RawScanEvidence }) => {
        if (cached?.found && cached.scanData) {
          setRawEvidence(cached.scanData);
        }
      })
      .catch(() => {
        // Results remain usable with the compact StoredScan fallback.
      });
  }, [urlParam]);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((response) => response.json())
      .then((data) => {
        const plan =
          (data?.user as { plan?: string } | undefined)?.plan ?? "";

        if (!data?.user) {
          setUserTier("anon");
          return;
        }

        setUserTier(normalizePlan(plan) !== null ? "paid" : "free");
      })
      .catch(() => setUserTier("anon"));
  }, []);

  useEffect(() => {
    if (!scan) return;

    let domain = scan.url;
    try {
      domain = new URL(scan.url).host;
    } catch {
      // URL bleibt wie gespeichert.
    }

    document.title = `Diagnose für ${domain} | WebsiteFix`;

    return () => {
      document.title = "WebsiteFix | WordPress-Diagnose";
    };
  }, [scan]);

  if (!loaded) {
    return (
      <div className="wf-results-state">
        <span>Lade Ergebnisse…</span>
      </div>
    );
  }

  if (scanMissing || !scan) {
    return (
      <>
        <ResultsNav />
        <main className="wf-results-shell">
          <section className="wf-results-missing">
            <span className="wf-results-eyebrow">Scan nicht verfügbar</span>
            <h1>Dieses Scan-Ergebnis kann nicht mehr geladen werden.</h1>
            <p>
              Der Kurzzeit-Cache ist möglicherweise abgelaufen. Starte den Scan
              erneut; vorhandene Projektdaten werden dadurch nicht verändert.
            </p>
            <Link
              className="wf-results-button-primary"
              href={
                urlParam
                  ? `/scan?url=${encodeURIComponent(urlParam)}`
                  : "/scan"
              }
            >
              Seite erneut prüfen →
            </Link>
          </section>
        </main>
        <SiteFooter />
      </>
    );
  }

  const diagnosis = buildDiagnosis(scan, rawEvidence);

  return (
    <>
      <ResultsNav domain={diagnosis.domain} />

      <main className="wf-results-shell">
        <div className="wf-results-container">
          <DiagnosisHeader diagnosis={diagnosis} />

          <ScanScopeSummary
            raw={rawEvidence}
            pagesChecked={diagnosis.pagesChecked}
          />

          {diagnosis.primaryFinding && (
            <PrimaryFinding finding={diagnosis.primaryFinding} paid={userTier === "paid"} />
          )}

          <FindingList findings={diagnosis.findings} paid={userTier === "paid"} />

          <section className="wf-results-performance">
            <div>
              <span className="wf-results-eyebrow">Performance</span>
              <h2>Ladezeit separat messen</h2>
              <p>
                Performance wird nicht geschätzt. Die Messung läuft separat über
                Google PageSpeed Insights und ergänzt den technischen Scan um
                Lighthouse- und Core-Web-Vitals-Werte.
              </p>
            </div>

            {userTier === "anon" ? (
              <div className="wf-results-performance-action">
                <PsiButton
                  url={scan.url}
                  onTrack={() =>
                    trackCta("Click PSI Anon", "results-v2-performance")
                  }
                />
              </div>
            ) : (
              <Link
                className="wf-results-button-secondary"
                href="/dashboard"
              >
                Performance im Projekt messen →
              </Link>
            )}
          </section>

          <TechnicalContext scan={scan} />

          <AffectedPages
            pages={diagnosis.pages}
            pagesChecked={diagnosis.pagesChecked}
            affectedPages={diagnosis.affectedPages}
            overallState={diagnosis.overallState}
            discoveredUrls={diagnosis.discoveredUrls}
          />

          <FixVerification
            url={scan.url}
            findings={diagnosis.findings}
            paid={userTier === "paid"}
          />

          {userTier !== "paid" && <UnlockDiagnosis />}

          <div className="wf-results-footer-action">
            <Link href="/scan">← Andere Seite prüfen</Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

function ResultsNav({ domain }: { domain?: string }) {
  return (
    <nav className="wf-results-nav">
      <div className="wf-results-nav-inner">
        <BrandLogo />

        <div className="wf-results-nav-right">
          {domain && <span className="wf-results-nav-domain">{domain}</span>}
          <a className="wf-results-nav-link" href="#betroffene-seiten">
            Befunde ansehen
          </a>
          <MobileNav />
        </div>
      </div>
    </nav>
  );
}

export default function ScanResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="wf-results-state">
          <span>Lade Ergebnisse…</span>
        </div>
      }
    >
      <ResultsInner />
    </Suspense>
  );
}
