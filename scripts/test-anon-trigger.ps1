# Stripe-CLI E2E-Test für anon Pay-per-Guide
# Triggert ein checkout.session.completed-Event mit rescue_guide_anon-metadata
# und reicht es an den localhost-Dev-Server (via stripe listen).
#
# Voraussetzungen:
#   - Terminal 1: `stripe listen --forward-to localhost:3000/api/webhooks/stripe` läuft
#   - Terminal 2: `npm run dev` läuft (Port 3000)
#   - .env.local hat sk_test_ + pk_test_ + whsec_ aus dem Listener-Output
#
# Aufruf: .\scripts\test-anon-trigger.ps1

$email = "angelika.szewczyk87@gmail.com"
$guide = "hosting-speed"
$hoster = "hetzner"

Write-Host ""
Write-Host "Triggering checkout.session.completed:" -ForegroundColor Cyan
Write-Host "  guide_id = $guide"
Write-Host "  hoster   = $hoster"
Write-Host "  email    = $email"
Write-Host ""

stripe trigger checkout.session.completed `
  --add "checkout_session:metadata[kind]=rescue_guide_anon" `
  --add "checkout_session:metadata[guide_id]=$guide" `
  --add "checkout_session:metadata[hoster]=$hoster" `
  --add "checkout_session:metadata[email]=$email" `
  --add "checkout_session:customer_email=$email"

Write-Host ""
Write-Host "Done. Pruefe Terminal 2 (Dev-Server-Log) auf '[stripe-webhook] anon guide ...'" -ForegroundColor Green
Write-Host "und deinen Posteingang ($email)." -ForegroundColor Green
