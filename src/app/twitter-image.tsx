import { ImageResponse } from 'next/og';
import { OG_ALT } from '@/lib/seo';
import { loadOgFonts, renderOgCard } from '@/lib/og-card';

export const runtime = 'nodejs';
export const alt = OG_ALT;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function TwitterImage() {
  const fonts = await loadOgFonts();
  return new ImageResponse(renderOgCard(false), { ...size, fonts });
}
