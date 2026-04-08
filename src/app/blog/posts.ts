export type Post = {
  slug:       string;
  title:      string;
  excerpt:    string;
  date:       string;       // ISO
  readingMin: number;
  category:   string;
  color:      string;       // accent color
  sections:   Section[];
};

type Section =
  | { type: "h2";       text: string }
  | { type: "h3";       text: string }
  | { type: "p";        text: string }
  | { type: "ul";       items: string[] }
  | { type: "quote";    text: string }
  | { type: "cta";      label: string; href: string }
  | { type: "callout";  title: string; text: string; color?: string };

export const POSTS: Post[] = [
  {
    slug:       "bfsg-2025-agenturen",
    title:      "Das BFSG 2025 – Warum Agenturen jetzt handeln müssen (oder haften)",
    excerpt:    "Ab dem 28. Juni 2025 greift das Barrierefreiheitsstärkungsgesetz. Was das für Agenturen mit Wartungskunden bedeutet – und wie du die Pflicht in ein Profit-Center verwandelst.",
    date:       "2025-05-12",
    readingMin: 5,
    category:   "Recht & WCAG",
    color:      "#7aa6ff",
    sections: [
      {
        type: "callout",
        title: "Die tickende Zeitbombe im Wartungsvertrag",
        text: `Ab dem 28. Juni 2025 tritt das Barrierefreiheitsstärkungsgesetz (BFSG) in Kraft. Was viele Agenturen unterschätzen: Es ist nicht mehr nur eine „nette Empfehlung" für staatliche Seiten. Es trifft fast alle Unternehmen, die Produkte oder Dienstleistungen online anbieten.`,
        color: "#ff6b6b",
      },
      {
        type: "h2",
        text: "Das Risiko für dich als Agentur",
      },
      {
        type: "p",
        text: "Wenn du für deine Kunden Webseiten wartest und diese ab Juni 2025 nicht den WCAG 2.1 AA Standards entsprechen, stehst du an vorderster Front.",
      },
      {
        type: "ul",
        items: [
          `Haftungsfallen: Kunden werden fragen: „Warum hast du mich nicht gewarnt?"`,
          `Reputationsschaden: Abmahnungen wegen fehlender Barrierefreiheit sind das neue „DSGVO-Gate".`,
          "Zeitfresser: Manuelle Prüfungen jeder einzelnen Unterseite sind unbezahlbar und fressen deine Marge.",
        ],
      },
      {
        type: "quote",
        text: "Barrierefreiheit ist kein Feature mehr – es ist eine rechtliche Grundvoraussetzung.",
      },
      {
        type: "h2",
        text: "Die Lösung: Proaktive Überwachung statt reaktiver Panik",
      },
      {
        type: "p",
        text: "Du kannst nicht jeden Tag händisch prüfen, ob ein Redakteur deines Kunden ein Bild ohne Alt-Text hochgeladen hat. Aber du kannst es automatisieren.",
      },
      {
        type: "p",
        text: "Mit WebsiteFix haben wir ein System entwickelt, das genau hier ansetzt:",
      },
      {
        type: "ul",
        items: [
          "Automatisierte WCAG-Scans: Unser System prüft kontinuierlich auf Barrieren (Kontrast, Struktur, Screenreader-Kompatibilität).",
          "KI-Fix-Vorschläge: Wenn ein Fehler gefunden wird, liefert WebsiteFix direkt den passenden Code-Schnipsel oder den Lösungsweg für dein Team.",
          `Der White-Label Beweis: Jeden Monat erhält dein Kunde einen vollautomatischen Bericht in deinem Agentur-Branding. Dort sieht er schwarz auf weiß: „Wir haben diesen Monat 12 Barrieren entfernt und Ihre Rechtssicherheit garantiert."`,
        ],
      },
      {
        type: "h2",
        text: "Fazit: Verwandle die Pflicht in ein Profit-Center",
      },
      {
        type: "p",
        text: "Das BFSG 2025 ist keine Last, sondern die Chance, deine Wartungsverträge aufzuwerten. Mit WebsiteFix sicherst du nicht nur die Seiten deiner Kunden ab, sondern verkaufst echte Rechtssicherheit – ohne eine einzige Minute extra in manuelle Reports zu investieren.",
      },
      {
        type: "cta",
        label: "Jetzt Agentur-Check starten →",
        href:  "/fuer-agenturen",
      },
    ],
  },
];

export function getPost(slug: string): Post | undefined {
  return POSTS.find(p => p.slug === slug);
}
