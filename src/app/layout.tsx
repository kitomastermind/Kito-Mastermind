import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, Inter, Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google';
import './globals.css';
import {
  OG_DESCRIPTION,
  OG_TITLE,
  SITE_DESCRIPTION,
  SITE_NAME,
  siteUrl,
  socialImages,
} from '@/lib/seo';

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

const images = socialImages();

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  category: 'business',
  keywords: [
    'KITO Mastermind',
    'Kenya real estate',
    'chapter network',
    'accountability',
    'invitation only',
  ],
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [{ url: '/mark.svg', type: 'image/svg+xml' }],
    apple: '/mark.svg',
  },
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: 'website',
    locale: 'en_KE',
    alternateLocale: ['en'],
    siteName: SITE_NAME,
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    url: '/',
    countryName: 'Kenya',
    images: [images.whatsapp, images.wide],
  },
  twitter: {
    card: 'summary_large_image',
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    images: [images.twitter],
  },
  appleWebApp: {
    title: SITE_NAME,
    statusBarStyle: 'black-translucent',
    capable: true,
  },
  other: {
    'og:site_name': SITE_NAME,
    'og:type': 'website',
    'og:image:type': 'image/png',
    'og:image:secure_url': images.whatsapp.url,
  },
};

export const viewport: Viewport = {
  themeColor: '#0E1F1A',
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-KE"
      className={`${plusJakarta.variable} ${inter.variable} ${spaceGrotesk.variable} ${ibmPlexMono.variable}`}
    >
      <body className="min-h-dvh bg-ambient font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
