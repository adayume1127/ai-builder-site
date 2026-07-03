import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Cinzel, Zen_Old_Mincho } from "next/font/google";

const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel", weight: ["400", "600", "700"] });
const zenOldMincho = Zen_Old_Mincho({ subsets: ["latin"], variable: "--font-zen", weight: ["400", "700"] });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: "LUNA AI | あなたのビジネスをカタチにします。",
  description:
    "AI「ルナ」が企画から開発・リリースまで仕上げる。これはルナが手がけたプロジェクトの記録です。",
  openGraph: {
    title: "LUNA AI | あなたのビジネスをカタチにします。",
    description: "AI「ルナ」が企画から開発・リリースまで仕上げる。",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} ${cinzel.variable} ${zenOldMincho.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
