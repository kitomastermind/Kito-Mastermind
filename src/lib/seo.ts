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

export function siteUrl(): URL {
  const raw = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  return new URL(raw);
}
