import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import { IBM_Plex_Mono, Inter, Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-plus-jakarta',
  weight: ['400', '500', '600', '700', '800'],
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space-grotesk',
  weight: ['400', '500', '600', '700'],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-ibm-plex-mono',
  weight: ['500', '600'],
});

export const metadata: Metadata = {
  title: 'KITO Mastermind',
  description: 'The private accountability circle for production chapters.',
  icons: { icon: '/mark.svg' },
};

export const viewport: Viewport = {
  themeColor: '#0E1F1A',
  viewportFit: 'cover',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await headers();
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${inter.variable} ${spaceGrotesk.variable} ${ibmPlexMono.variable}`}
    >
      <body className="min-h-dvh bg-ambient font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
