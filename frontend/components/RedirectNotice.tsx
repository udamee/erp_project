"use client";

import { ReactNode } from "react";
import { LockOutlined, StopOutlined, WarningOutlined } from "@ant-design/icons";

// 리다이렉트 직전에 "무엇이 잘못됐고 어디로 이동하는지"를 사용자에게 설명하는 안내 모듈.
// ErpLayout의 세션/권한 가드에서 빈 화면 대신 이 컴포넌트를 렌더한다.
type Tone = "info" | "warning" | "error";

const TONE: Record<Tone, { fg: string; bg: string; icon: ReactNode }> = {
  info: { fg: "var(--erp-info)", bg: "var(--erp-info-bg)", icon: <WarningOutlined /> },
  warning: { fg: "var(--erp-warning)", bg: "var(--erp-warning-bg)", icon: <LockOutlined /> },
  error: { fg: "var(--erp-danger)", bg: "var(--erp-danger-bg)", icon: <StopOutlined /> },
};

export default function RedirectNotice({
  title,
  description,
  tone = "info",
  action,
}: {
  title: string;
  description: string;
  tone?: Tone;
  action?: ReactNode;
}) {
  const t = TONE[tone];
  return (
    <div
      role="alert"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div className="erp-card" style={{ maxWidth: 400, width: "100%", textAlign: "center", padding: "36px 28px" }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: t.bg,
            color: t.fg,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            marginBottom: 18,
          }}
        >
          {t.icon}
        </div>
        <h2 style={{ margin: "0 0 8px", fontSize: 18, color: "var(--erp-text)" }}>{title}</h2>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "var(--erp-text-muted)" }}>{description}</p>
        {action && <div style={{ marginTop: 22, display: "flex", justifyContent: "center", gap: 8 }}>{action}</div>}
      </div>
    </div>
  );
}
