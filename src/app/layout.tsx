import type { Metadata } from "next";
import { AppProvider } from "@/components/providers/app-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "KAS 协作平台",
  description: "面向课程作业的小组协作与评分平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
