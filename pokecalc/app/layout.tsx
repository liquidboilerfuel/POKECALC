import type { Metadata } from "next";
import { headers } from 'next/headers';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// --- SEO & メタデータ設定 ---
export const metadata: Metadata = {
  title: 'POKECALC | ポケカ確率計算機',
  description: 'Instant probability for PTCG. Supports JP/EN deck lists. / マリガン率、サイド落ち、手札干渉からの復帰率を瞬時にシミュレート。',
  keywords: [
    'ポケカ', '確率計算', 'Pokémon TCG', 'Probability', 'Mulligan', 'Judge', 'Unfair Stamp',
    'ポケカ計算機', 'サイド落ち', 'マリガン', 'デッキ圧縮', 'PTCGL', 'ポケモンカード',
    'TRON NEKO', 'PokeCalc', 'ぽけかるく', 'ポケカルク', 'PTCG'
  ],
  authors: [{ name: 'TRON NEKO' }],
  openGraph: {
    title: 'POKECALC | Pokémon TCG Probability Calculator',
    description: 'Calculate your win rate with precision. Analyze your deck list for optimal consistency. Created by TRON NEKO.',
    url: 'https://pokecalc-ptcg.vercel.app/',
    siteName: 'POKECALC',
    locale: 'ja_JP',
    type: 'website',
    images: [
      {
        url: 'https://pokecalc-ptcg.vercel.app/og-image.png',
        width: 1200,
        height: 630,
        alt: 'POKECALC UI Preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'POKECALC | ポケカ確率計算機',
    description: 'マリガン率、サイド落ち、ジャッジマンからの復帰率を瞬時に計算。',
  },
  verification: {
    google: 'Ccitf5XujBeKOKi5BYwnoVp1e2bvESUF5c5SGXiFTNs',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // --- 多言語対応: ブラウザの言語設定を取得 ---
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language') || '';
  const lang = acceptLanguage.startsWith('ja') ? 'ja' : 'en';

  // --- JSON-LD: 構造化データ (Google検索用) ---
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "POKECALC",
    "url": "https://pokecalc-ptcg.vercel.app/",
    "description": "Pokémon TCG Probability Calculator for Mulligan, Prize cards, and hand disruption recovery.",
    "applicationCategory": "Utility",
    "operatingSystem": "All",
    "author": {
      "@type": "Person",
      "name": "TRON NEKO"
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "JPY"
    }
  };

  return (
    <html
      lang={lang}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* 構造化データの埋め込み */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}