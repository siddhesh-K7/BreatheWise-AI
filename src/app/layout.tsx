import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SkipLink } from '@/components/layout/SkipLink';

export const metadata: Metadata = {
  title: 'AirWise — Urban Air Quality & Winter Smog Assistant',
  description:
    'GenAI-powered assistant helping families and communities navigate severe winter smog with low-emission routines, indoor air hacks, and quantified impact tracking.',
  keywords: [
    'AQI',
    'smog',
    'air pollution',
    'winter smog',
    'HEPA filter',
    'Gemini AI',
    'Open-Meteo',
    'urban resilience',
    'clean air',
  ],
  authors: [{ name: 'Siddhesh', url: 'https://github.com/siddhesh-K7' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-slate-950">
        <SkipLink />
        {children}
      </body>
    </html>
  );
}
