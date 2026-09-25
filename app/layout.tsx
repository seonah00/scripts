import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GlobalViral · 글로벌 콘텐츠 스튜디오",
  description: "제품과 매장 정보로 만드는 틱톡·샤오홍슈 콘텐츠 기획과 표현 검토",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
