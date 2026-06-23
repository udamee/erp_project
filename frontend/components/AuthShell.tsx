"use client";

import { ReactNode } from "react";

// 로그인·회원가입 등 비인증 화면의 공통 셸.
// ErpLayout(사이드바)을 쓰지 않는 대신, 중앙 정렬 카드 + 브랜드 헤더를 공통 디자인 토큰으로 통일한다.
export default function AuthShell({
  title,
  subtitle,
  onSubmit,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--erp-bg)", padding: "24px 0",
    }}>
      <form
        onSubmit={onSubmit}
        className="erp-card"
        style={{ width: 360, padding: 32, display: "flex", flexDirection: "column", gap: 14 }}
      >
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10, background: "var(--erp-primary)", color: "#fff",
            display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700,
          }}>
            약
          </div>
          <h2 style={{ margin: "10px 0 0", fontSize: 18 }}>{title}</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--erp-text-muted)" }}>{subtitle}</p>
        </div>

        {children}
        {footer}
      </form>
    </div>
  );
}
