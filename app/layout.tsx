import type { Metadata } from "next";
import { Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const notoSans = Noto_Sans_KR({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const notoSerif = Noto_Serif_KR({
  variable: "--font-noto-serif",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Crescendo of Abundance",
  description:
    "오늘, 대지가 이성을 잃었습니다. 가장 완벽한 과잉을 소비할 시간. KAMIS 모의 출하량으로 방울토마토가 쏟아지는 인터랙티브 랜딩.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${notoSans.variable} ${notoSerif.variable} h-full antialiased`}
    >
      <head>
        <Script src="/frost-boot.js" strategy="beforeInteractive" />
      </head>
      <body className="min-h-full overflow-hidden bg-[#14080b] font-sans">
        {children}
      </body>
    </html>
  );
}
