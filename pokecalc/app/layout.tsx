import type { Metadata } from "next";
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

export const metadata = {
  title: 'POKECALC | PTCG Calc / ポケカ確率計算機',
  description: 'Instant probability for Mulligan, Prize cards, and recovery from Judge or Unfair Stamp. / マリガン率、サイド落ち、ジャッジマンやアンフェアスタンプからの復帰率を瞬時に計算。',
  keywords: ['ポケカ', '確率計算', 'Pokémon TCG', 'Probability', 'Mulligan', 'Judge', 'Unfair Stamp', 'ポケカ計算機', 'TRON NEKO'],
  openGraph: {
    title: 'POKECALC | 2026 Pokémon TCG Probability Calculator',
    description: 'Calculate your win rate with precision. Created by TRON NEKO.',
    type: 'website',
  },
  verification: {
    google: 'Ccitf5XujBeKOKi5BYwnoVp1e2bvESUF5c5SGXiFTNs',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
