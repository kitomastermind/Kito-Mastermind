import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { loadOgFonts, renderOgCard } from '../src/lib/og-card';

async function writeCard(name: string, square: boolean) {
  const size = square ? { width: 1200, height: 1200 } : { width: 1200, height: 630 };
  const fonts = await loadOgFonts();
  const response = new ImageResponse(renderOgCard(square), { ...size, fonts });
  const buffer = Buffer.from(await response.arrayBuffer());
  const file = join(process.cwd(), 'public/og', `${name}.png`);
  await writeFile(file, buffer);
}

async function main() {
  await mkdir(join(process.cwd(), 'public/og'), { recursive: true });
  await writeCard('whatsapp', true);
  await writeCard('wide', false);
  await writeCard('twitter', false);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
