import { siteOrigin } from '@/lib/seo';

export const EMAIL = {
  product: 'KITO Mastermind',
  eyebrow: 'CHAPTER NETWORK · MEMBERS ONLY',
  forest: '#0E1F1A',
  forestSoft: '#1A3A2E',
  lime: '#D3F36B',
  gold: '#F0C419',
  cream: '#EEF2EE',
  paper: '#FFFFFF',
  ink: '#0E1F1A',
  muted: '#5A6B7D',
  footer:
    "A client's name, phone and email stay with the member who logged them. Membership is by invitation only.",
} as const;

export function appUrl(): string {
  return siteOrigin();
}

export function absoluteAppUrl(path: string): string {
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${appUrl()}${suffix}`;
}
