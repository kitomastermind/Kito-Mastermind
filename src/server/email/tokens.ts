import { siteOrigin } from '@/lib/seo';

export const EMAIL = {
  product: 'KITO Mastermind',
  eyebrow: 'CHAPTER NETWORK · MEMBERS ONLY',
  forest: '#204559',
  forestSoft: '#2D5F75',
  lime: '#9BA63E',
  gold: '#9BA63E',
  cream: '#EEF2F3',
  paper: '#FFFFFF',
  ink: '#204559',
  muted: '#5A6E78',
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
