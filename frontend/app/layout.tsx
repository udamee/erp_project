import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import "antd/dist/reset.css";
import "./globals.css";
import "./erp.css";

export const metadata: Metadata = {
  title: "약통 ERP",
  description: "약통 ERP 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full">
        <AntdRegistry>{children}</AntdRegistry>
      </body>
    </html>
  );
}
