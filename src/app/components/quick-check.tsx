"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { track } from "@/lib/track";

type CheckConfig = {
  key: "speed" | "forms" | "default";
  title: string;
  questions: string[];
  fixLabel: string;
};

const CHECK_CONFIGS: Record<string, CheckConfig> = {
  speed: {
    key: "speed",
    title: "Performance-Check",
    questions: [
      "Lädt deine Website spürbar zu langsam?",
      "Springen Besucher ab, bevor Inhalte sichtbar sind?",
      "Hast du das Gefühl, dass Ladezeit dich Anfragen kostet?",
    ],
    fixLabel: "Fix #2 – Website schneller machen",
  },

  forms: {
    key: "forms",
    title: "Anfragen-Check",
    questions: [
      "Kommen Anfragen gar nicht oder unregelmäßig an?",
      "Landen E-Mails möglicherweise im Spam?",
      "Bist du unsicher, ob dein Formular sauber versendet?",
    ],
    fixLabel: "Fix #1 – Kontaktformular reparieren",
  },

  default: {
    key: "default",
    title: "Status-Check",
    questions: [
      "Zeigt deine Website Fehler oder instabiles Verhalten?",
      "Gibt es Probleme mobil, im Layout oder bei Funktionen?",
      "Bist du unsicher, ob dein Fall zu einem Standard-Fix passt?",
    ],
    fixLabel: "Individueller Fix",
  },
};

export default function QuickCheck() {
  const [step, setStep] = useState(0);
  const [yesCount, setYesCount] = useState(0);
  const [config, setConfig] = useState<CheckConfig>(CHECK_CONFIGS.default);
  const [showResult, setShowResult] = useState(false);

  const hasStartedRef = useRef(false);
  const lastTrackedStepRef = useRef<number | null>(null);

  useEffect(() => {
    const path = window.location.pathname.toLowerCase();

    if (
      path.includes("speed") ||
      path.includes("langsam") ||
      path.includes("performance")
    ) {
      setConfig(CHECK_CONFIGS.speed);
    } else if (
      path.includes("formular") ||
      path.includes("kontakt") ||
      path.includes("email")
    ) {
      setConfig(CHECK_CONFIGS.forms);
    } else {
      setConfig(CHECK_CONFIGS.default);
    }
  }, []);

  useEffect(() => {
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;

      track("quick_check_started", {
        check_type: config.key,
        question_count: config.questions.length,
      });
    }
  }, [config]);

  useEffect(() => {
    if (showResult) return;

    if (lastTrackedStepRef.current === step) return;
    lastTrackedStepRef.current = step;

    track("quick_check_step_view", {
      check_type: config.key,
      step_index: step,
      step_number: step + 1,
      question_text: config.questions[step],
    });
  }, [step, showResult, config]);

  useEffect(() => {
    return () => {
      if (!showResult) {
        track("quick_check_abandoned", {
          check_type: config.key,
          last_step_index: step,
          last_step_number: step + 1,
          yes_count: yesCount,
        });
      }
    };
  }, [showResult, step, yesCount, config]);

  const result = useMemo(() => {
    if (yesCount <= 1) {
      return {
        severity: "low",
        title: "Kein akutes Problem erkannt",
        text:
          "Aktuell scheint kein kritisches Problem vorzuliegen. Wenn du trotzdem optimieren willst, lohnt sich ein Blick auf die Fixes.",
        primaryLabel: "Fixes ansehen →",
        primaryHref: "/#fixes",
      };
    }

    if (yesCount === 2) {
      return {
        severity: "medium",
        title: "Wahrscheinlich Optimierungsbedarf",
        text:
          "Einige deiner Antworten deuten darauf hin, dass deine Website Potenzial liegen lässt. Ein gezielter Fix kann schnell spürbare Verbesserungen bringen.",
        primaryLabel:
          config.key === "default"
            ? "Passenden Fix ansehen →"
            : `${config.fixLabel} →`,
        primaryHref: "/#fixes",
      };
    }

    return {
      severity: "high",
      title: "Klarer Handlungsbedarf",
      text:
        "Deine Antworten zeigen deutlich, dass ein technisches Problem vorliegt. Genau solche Fälle lösen wir schnell und zum Fixpreis.",
      primaryLabel:
        config.key === "default"
          ? "Problem anfragen →"
          : "Jetzt Fix starten →",
      primaryHref: config.key === "default" ? "/#book" : "/#fixes",
    };
  }, [yesCount, config]);

  const answer = (isYes: boolean) => {
    const nextYesCount = isYes ? yesCount + 1 : yesCount;

    track("quick_check_answered", {
      check_type: config.key,
      step_index: step,
      step_number: step + 1,
      answer: isYes ? "yes" : "no",
      yes_count_after_answer: nextYesCount,
      question_text: config.questions[step],
    });

    if (isYes) setYesCount((prev) => prev + 1);

    if (step + 1 >= config.questions.length) {
      setShowResult(true);

      track("quick_check_completed", {
        check_type: config.key,
        yes_count: nextYesCount,
        total_questions: config.questions.length,
        result_severity:
          nextYesCount <= 1 ? "low" : nextYesCount === 2 ? "medium" : "high",
      });
    } else {
      setStep((prev) => prev + 1);
    }
  };

  const handlePrimaryClick = () => {
    track("quick_check_result_cta_click", {
      check_type: config.key,
      cta_type: "primary",
      destination: result.primaryHref,
      result_severity: result.severity,
      yes_count: yesCount,
    });
  };

  const handleSecondaryClick = () => {
    track("quick_check_result_cta_click", {
      check_type: config.key,
      cta_type: "secondary",
      destination: "/#book",
      result_severity: result.severity,
      yes_count: yesCount,
    });
  };

  return (
    <section className="qcSection">
      <div className="qcCard">
        <div className="qcTop">
          <span className="qcBadge">{config.title}</span>

          {!showResult && (
            <span className="qcStep">
              {step + 1} / {config.questions.length}
            </span>
          )}
        </div>

        {!showResult ? (
          <div key={step} className="qcBody qcFade">
            <h2 className="qcQuestion">{config.questions[step]}</h2>

            <p className="qcHint">
              Kurzer Check – dauert nur wenige Sekunden.
            </p>

            <div className="qcActions">
              <button
                type="button"
                onClick={() => answer(true)}
                className="qcActionBtn qcActionBtnPrimary"
              >
                Ja
              </button>

              <button
                type="button"
                onClick={() => answer(false)}
                className="qcActionBtn qcActionBtnGhost"
              >
                Nein
              </button>
            </div>
          </div>
        ) : (
          <div className="qcBody qcFade">
            <h2 className="qcResultTitle">{result.title}</h2>

            <p className="qcResultText">{result.text}</p>

            <div className="qcActions">
              <a
                href={result.primaryHref}
                className="qcActionBtn qcActionBtnPrimary qcActionLink"
                onClick={handlePrimaryClick}
              >
                {result.primaryLabel}
              </a>

              <a
                href="/#book"
                className="qcActionBtn qcActionBtnGhost qcActionLink"
                onClick={handleSecondaryClick}
              >
                Individuell anfragen
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}