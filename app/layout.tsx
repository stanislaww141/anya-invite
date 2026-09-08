import type { Metadata } from 'next';
import { Cormorant_Garamond, Manrope } from 'next/font/google';
import { assetUrl } from '@/lib/asset-url';
import './globals.css';

const sans = Manrope({ variable: '--font-sans-invite', subsets: ['latin', 'cyrillic'], display: 'swap' });
const serif = Cormorant_Garamond({ variable: '--font-serif-invite', subsets: ['latin', 'cyrillic'], weight: ['400', '500'], style: ['normal', 'italic'], display: 'swap' });

export const metadata: Metadata = {
  title: '',
  description: '',
  openGraph: { title: '', description: '', siteName: '', type: 'website' },
  twitter: { card: 'summary', title: '', description: '' },
  robots: { index: false, follow: false, nosnippet: true, noimageindex: true },
  icons: { icon: assetUrl('/icon.svg') },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body className={sans.variable + ' ' + serif.variable}>{children}</body></html>;
}

