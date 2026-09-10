export const SITE_NAME = 'KITO Mastermind';

export const SITE_TAGLINE = 'The private accountability circle for production chapters.';

export const SITE_DESCRIPTION =
  'Invitation-only chapters for Kenyan production agents. Members keep promises and match work — client names stay with the member who logged them.';

/** WhatsApp truncates around two lines. Keep this tight. */
export const OG_TITLE = 'KITO Mastermind — keep the circle accountable';

export const OG_DESCRIPTION =
  'Invitation-only chapter room. Client names stay locked until the owner grants access.';

export const OG_ALT =
  'KITO Mastermind — invitation-only accountability circle for Kenyan production chapters';

export const PRODUCTION_SITE_URL = 'https://kito-mastermind.onrender.com';

function normalizeOrigin(raw: string): string {
  return raw.trim().replace(/\/$/, '');
}

function isUsableOrigin(raw: string): boolean {
  if (!raw) return false;
  try {
    const url = new URL(raw);
    if (!/^https?:$/.test(url.protocol)) return false;
    const host = url.hostname.toLowerCase();
    return !host.includes('your-service') && !host.includes('yourdomain') && !host.includes('example.com');
  } catch {
    return false;
  }
}

export function siteUrl(): URL {
  const fromEnv = normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL ?? '');
  if (isUsableOrigin(fromEnv)) {
    return new URL(fromEnv);
  }
  if (process.env.NODE_ENV === 'production') {
    return new URL(PRODUCTION_SITE_URL);
  }
  return new URL('http://localhost:3000');
}

export function siteOrigin(): string {
  return normalizeOrigin(siteUrl().origin);
}

export function absoluteSiteUrl(path = '/'): string {
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${siteOrigin()}${suffix === '/' ? '/' : suffix}`;
}

export function socialImages() {
  const origin = siteOrigin();
  return {
    whatsapp: {
      url: `${origin}/og/whatsapp.png`,
      width: 1200,
      height: 1200,
      alt: OG_ALT,
      type: 'image/png' as const,
    },
    wide: {
      url: `${origin}/og/wide.png`,
      width: 1200,
      height: 630,
      alt: OG_ALT,
      type: 'image/png' as const,
    },
    twitter: {
      url: `${origin}/og/twitter.png`,
      width: 1200,
      height: 630,
      alt: OG_ALT,
      type: 'image/png' as const,
    },
  };
}
