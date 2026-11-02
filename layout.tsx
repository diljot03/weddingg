import type { Metadata, Viewport } from 'next';
import './globals.css';
import { FONT_LINK } from '@/lib/themes';
import { RegisterSW } from '@/components/RegisterSW';
import { asset } from '@/lib/base';

export const metadata: Metadata = {
  title: 'Pratha & Nikhil · Wedding Guest App',
  description: 'Invitation, itinerary, photos, chat, song requests and Sangeet sign-ups for our wedding guests.',
  manifest: asset('/manifest.json'),
  appleWebApp: { capable: true, title: 'Our Wedding', statusBarStyle: 'black-translucent' },
  icons: { icon: asset('/icons/icon-192.png'), apple: asset('/icons/apple-touch-icon.png') },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#581826',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={FONT_LINK} />
      </head>
      <body>
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
