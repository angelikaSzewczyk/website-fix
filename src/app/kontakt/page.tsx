import type { Metadata } from "next";
import KontaktClient from "./kontakt-client";

export const metadata: Metadata = {
  title: "Kontakt — WebsiteFix",
  description: "Fragen, Feedback oder Partneranfragen? Schreib uns — wir melden uns schnell.",
};

export default function KontaktPage() {
  return <KontaktClient />;
}
