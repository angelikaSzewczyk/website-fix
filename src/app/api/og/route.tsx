import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get('title') || 'WebsiteFix — Schnelle Hilfe';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            backgroundColor: '#0f172a', // Dein dunkler Hintergrund
            padding: '80px',
          }}
        >
          {/* Logo-Ersatz oder echtes Logo */}
          <div style={{ color: '#38bdf8', fontSize: 32, fontWeight: 'bold', marginBottom: 20 }}>
            WebsiteFix
          </div>
          
          <div
            style={{
              fontSize: 60,
              fontWeight: 'bold',
              color: 'white',
              lineHeight: 1.2,
              wordBreak: 'break-word',
            }}
          >
            {title}
          </div>

          <div style={{ display: 'flex', marginTop: 40, alignItems: 'center' }}>
            <div style={{ width: 40, height: 4, backgroundColor: '#38bdf8', marginRight: 20 }} />
            <div style={{ color: '#94a3b8', fontSize: 24 }}>WebsiteFix – Die Cloud-Lösung für Agenturen</div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    return new Response(`Failed to generate image`, { status: 500 });
  }
}