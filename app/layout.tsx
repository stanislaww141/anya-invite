import type { Metadata } from 'next';
import { Cormorant_Garamond, Manrope } from 'next/font/google';
import { assetUrl } from '@/lib/asset-url';
import './globals.css';

const sans = Manrope({ variable: '--font-sans-invite', subsets: ['latin', 'cyrillic'], display: 'swap' });
const serif = Cormorant_Garamond({ variable: '--font-serif-invite', subsets: ['latin', 'cyrillic'], weight: ['400', '500'], style: ['normal', 'italic'], display: 'swap' });

export const metadata: Metadata = {
  title: 'Аня, полетели? · Маленькое приключение',
  description: 'Маленькое приключение для Ани и приглашение на свидание. Ресторан SOMA, 13 сентября 2026, 18:00. Москва, Петровский бульвар, 14.',
  robots: { index: false, follow: false },
  icons: { icon: assetUrl('/icon.svg') },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body className={sans.variable + ' ' + serif.variable}>{children}</body></html>;
}

