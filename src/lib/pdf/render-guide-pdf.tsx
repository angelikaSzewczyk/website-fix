/**
 * Server-only Wrapper, der einen RescueGuide via @react-pdf/renderer
 * in einen PDF-Buffer übersetzt. Wird im Stripe-Webhook genutzt, um den
 * Guide als Email-Anhang zu verschicken.
 *
 * Wichtig: NICHT von Client-Code importieren — react-pdf/node-Bundle ist
 * nicht edge-kompatibel und wäre ein 800-KB-Client-Payload.
 */
import { renderToBuffer } from "@react-pdf/renderer";
import { GuidePdf } from "./guide-pdf";
import type { RescueGuide } from "@/lib/rescue-guides";

export async function renderGuidePdfBuffer({
  guide,
  hoster,
  buyerEmail,
  stripeSessionId,
}: {
  guide:            RescueGuide;
  hoster:           string;
  buyerEmail?:      string;
  stripeSessionId?: string;
}): Promise<Buffer> {
  return await renderToBuffer(
    <GuidePdf
      guide={guide}
      hoster={hoster}
      buyerEmail={buyerEmail}
      stripeSessionId={stripeSessionId}
    />,
  );
}
