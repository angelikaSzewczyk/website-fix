"use client";

import { useEffect, useRef, useState } from "react";

type Stat = {
  target: number;
  prefix?: string;
  suffix?: string;
  label: string;
  static?: string; // if set, skip counter and show this text
};

const STATS: Stat[] = [
  { target: 90, suffix: " Std.", label: "Ø Zeitersparnis/Monat (bei 20 Kunden)" },
  { target: 400, prefix: "+", suffix: "€", label: "Zusatz-Umsatz pro Wartungskunde" },
  { target: 0, static: "BFSG 2025", label: "Vollautomatisch geprüft & dokumentiert" },
];

function useCountUp(target: number, duration = 1400, start = false) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!start) return;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, start]);

  return value;
}

function Counter({ stat, start }: { stat: Stat; start: boolean }) {
  const count = useCountUp(stat.target, 1400, start);
  const display = stat.static
    ? stat.static
    : `${stat.prefix ?? ""}${count}${stat.suffix ?? ""}`;

  return (
    <div style={{ textAlign: "center", minWidth: 160 }}>
      <div style={{
        fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em",
        fontVariantNumeric: "tabular-nums",
        opacity: start ? 1 : 0,
        transform: start ? "translateY(0)" : "translateY(6px)",
        transition: "opacity 0.4s ease, transform 0.4s ease",
      }}>
        {display}
      </div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 4, lineHeight: 1.4 }}>
        {stat.label}
      </div>
    </div>
  );
}

export default function AgencyStats() {
  const [fired, setFired] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setFired(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{
      marginTop: 52,
      display: "flex", gap: 40, justifyContent: "center", flexWrap: "wrap",
    }}>
      {STATS.map(s => <Counter key={s.label} stat={s} start={fired} />)}
    </div>
  );
}
