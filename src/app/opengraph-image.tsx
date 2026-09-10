import { ImageResponse } from 'next/og';
import { OG_ALT } from '@/lib/seo';
import { loadOgFonts, renderOgCard } from '@/lib/og-card';

export const runtime = 'nodejs';

export function generateImageMetadata() {
  return [
    {
      contentType: 'image/png',
      id: 'whatsapp',
      size: { width: 1200, height: 1200 },
      alt: OG_ALT,
    },
    {
      contentType: 'image/png',
      id: 'wide',
      size: { width: 1200, height: 630 },
      alt: OG_ALT,
    },
  ];
}

export default async function Image({ id }: { id?: string }) {
  const square = id !== 'wide';
  const size = square ? { width: 1200, height: 1200 } : { width: 1200, height: 630 };
  const fonts = await loadOgFonts();
  return new ImageResponse(renderOgCard(square), { ...size, fonts });
}
