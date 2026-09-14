import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import React, { type ReactElement } from 'react';

const FOREST = '#204559';
const FOREST_SOFT = '#2D5F75';
const LIME = '#9BA63E';
const GOLD = '#9BA63E';
const PAPER = '#F3FAF5';
const MUTED = '#B7C4BC';

const MARK_SRC =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill="#204559"/><g fill="none" stroke="#9BA63E" stroke-width="2.2" stroke-linecap="butt"><path d="M13 10v20"/><path d="M18.5 10L28 10L19.5 20"/><path d="M13 20L28 30"/></g></svg>`,
  );

export async function loadOgFonts() {
  const dir = join(process.cwd(), 'src/app/og/fonts');
  const [jakarta800, jakarta600, mono] = await Promise.all([
    readFile(join(dir, 'plus-jakarta-800.woff')),
    readFile(join(dir, 'plus-jakarta-600.woff')),
    readFile(join(dir, 'ibm-plex-mono-600.woff')),
  ]);
  return [
    { name: 'Plus Jakarta Sans', data: jakarta800, weight: 800 as const, style: 'normal' as const },
    { name: 'Plus Jakarta Sans', data: jakarta600, weight: 600 as const, style: 'normal' as const },
    { name: 'IBM Plex Mono', data: mono, weight: 600 as const, style: 'normal' as const },
  ];
}

function Ring({
  size,
  right,
  top,
}: {
  size: number;
  right: number;
  top: number;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        right,
        top,
        width: size,
        height: size,
        borderRadius: size,
        border: '2px solid rgba(211,243,107,0.14)',
        display: 'flex',
      }}
    />
  );
}

function Wordmark({ mark, titleSize, subSize }: { mark: number; titleSize: number; subSize: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
      <img src={MARK_SRC} width={mark} height={mark} alt="" />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            display: 'flex',
            fontFamily: 'Plus Jakarta Sans',
            fontSize: titleSize,
            fontWeight: 800,
            color: LIME,
            letterSpacing: 6,
            lineHeight: 1,
          }}
        >
          KITO
        </div>
        <div
          style={{
            display: 'flex',
            fontFamily: 'Plus Jakarta Sans',
            fontSize: Math.round(subSize * 0.72),
            fontWeight: 600,
            color: MUTED,
            letterSpacing: 1,
            lineHeight: 1.2,
            marginTop: 8,
          }}
        >
          Real People. Exceptional Results.
        </div>
      </div>
    </div>
  );
}

export function renderOgCard(square: boolean): ReactElement {
  if (square) {
    return (
      <div
        style={{
          width: 1200,
          height: 1200,
          background: `linear-gradient(160deg, ${FOREST_SOFT} 0%, ${FOREST} 42%, ${FOREST} 100%)`,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ width: '100%', height: 12, background: LIME, display: 'flex' }} />
        <Ring size={820} right={-240} top={210} />
        <Ring size={620} right={-140} top={310} />
        <Ring size={420} right={-40} top={410} />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            flex: 1,
            padding: '80px 92px 88px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
            <div
              style={{
                display: 'flex',
                fontFamily: 'IBM Plex Mono',
                fontSize: 22,
                fontWeight: 600,
                color: LIME,
                letterSpacing: 4,
              }}
            >
              CHAPTER NETWORK · MEMBERS ONLY
            </div>
            <Wordmark mark={120} titleSize={92} subSize={48} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 900 }}>
            <div
              style={{
                width: 56,
                height: 6,
                background: LIME,
                borderRadius: 4,
                display: 'flex',
              }}
            />
            <div
              style={{
                display: 'flex',
                fontFamily: 'Plus Jakarta Sans',
                fontSize: 64,
                fontWeight: 800,
                color: PAPER,
                letterSpacing: -2.2,
                lineHeight: 1.05,
              }}
            >
              Keep the circle accountable.
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                fontFamily: 'Plus Jakarta Sans',
                fontSize: 30,
                fontWeight: 600,
                color: MUTED,
                lineHeight: 1.35,
                maxWidth: 820,
              }}
            >
              <div style={{ display: 'flex' }}>Invitation-only chapters for production agents.</div>
              <div style={{ display: 'flex' }}>Client names stay with the member who logged them.</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ width: '100%', height: 2, background: GOLD, display: 'flex' }} />
            <div
              style={{
                display: 'flex',
                fontFamily: 'IBM Plex Mono',
                fontSize: 20,
                fontWeight: 600,
                color: GOLD,
                letterSpacing: 3.2,
              }}
            >
              KENYA · BY INVITATION ONLY
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: 1200,
        height: 630,
        background: `linear-gradient(105deg, ${FOREST} 0%, ${FOREST_SOFT} 58%, ${FOREST} 100%)`,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ width: '100%', height: 8, background: LIME, display: 'flex' }} />
      <Ring size={560} right={-160} top={40} />
      <Ring size={400} right={-80} top={120} />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flex: 1,
          padding: '48px 72px 52px',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontFamily: 'IBM Plex Mono',
            fontSize: 16,
            fontWeight: 600,
            color: LIME,
            letterSpacing: 3.4,
          }}
        >
          CHAPTER NETWORK · MEMBERS ONLY
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
          <Wordmark mark={96} titleSize={72} subSize={36} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 860 }}>
          <div
            style={{
              display: 'flex',
              fontFamily: 'Plus Jakarta Sans',
              fontSize: 42,
              fontWeight: 800,
              color: PAPER,
              letterSpacing: -1.4,
              lineHeight: 1.1,
            }}
          >
            Keep the circle accountable.
          </div>
          <div
            style={{
              display: 'flex',
              fontFamily: 'Plus Jakarta Sans',
              fontSize: 22,
              fontWeight: 600,
              color: MUTED,
              lineHeight: 1.4,
              maxWidth: 760,
            }}
          >
            Invitation-only chapters. Client names stay locked until the owner grants access.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 72, height: 2, background: GOLD, display: 'flex' }} />
          <div
            style={{
              display: 'flex',
              fontFamily: 'IBM Plex Mono',
              fontSize: 15,
              fontWeight: 600,
              color: GOLD,
              letterSpacing: 2.6,
            }}
          >
            KENYA · BY INVITATION ONLY
          </div>
        </div>
      </div>
    </div>
  );
}
