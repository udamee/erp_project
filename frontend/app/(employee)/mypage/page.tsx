"use client";

import { useCallback, useEffect, useState } from "react";
import ErpLayout from "@/components/ErpLayout";
import { roleLabel } from "@/components/EmployeeStatusBadge";
import { employeeApi, type Employee } from "@/lib/api";
import { authApi } from "@/lib/auth-api";
import { useAuthUser } from "@/lib/hooks";

// 위→아래 라벨-값 리스트 한 줄
function Row({ label, children, last }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 16, minHeight: 48, padding: "8px 4px",
      borderBottom: last ? "none" : "1px solid var(--erp-line)",
    }}>
      <span style={{ width: 96, flexShrink: 0, fontSize: 13, color: "var(--erp-text-muted)" }}>{label}</span>
      <div style={{ flex: 1, fontSize: 14 }}>{children}</div>
    </div>
  );
}

export default function MyPage() {
  const [me, setMe] = useState<Employee | null>(null);

  // 내 정보 수정 (연락처·이메일만)
  const [editing, setEditing] = useState(false);
  const [info, setInfo] = useState({ phone: "", email: "" });
  const [infoBusy, setInfoBusy] = useState(false);

  // 비밀번호 변경
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", checkNewPassword: "" });
  const [pwBusy, setPwBusy] = useState(false);
  const [pwError, setPwError] = useState("");

  const load = useCallback(() => {
    employeeApi.me().then((e) => {
      setMe(e);
      setInfo({ phone: e.phone ?? "", email: e.email ?? "" });
    }).catch(() => {});
  }, []);

  useEffect(load, [load]);

  const saveInfo = async () => {
    setInfoBusy(true);
    try {
      await employeeApi.updateMyInfo(info);
      setEditing(false);
      load();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setInfoBusy(false);
    }
  };

  const changePassword = async () => {
    setPwError("");
    if (pw.newPassword.length < 8) {
      setPwError("새 비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (pw.newPassword !== pw.checkNewPassword) {
      setPwError("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    setPwBusy(true);
    try {
      await authApi.changePassword(pw);
      alert("비밀번호가 변경되었습니다.");
      setPw({ currentPassword: "", newPassword: "", checkNewPassword: "" });
    } catch (e) {
      setPwError((e as Error).message);
    } finally {
      setPwBusy(false);
    }
  };

  const cached = useAuthUser();

  const [tab, setTab] = useState<"info" | "password">("info");
  const tabs = [
    { key: "info" as const, label: "내 정보" },
    { key: "password" as const, label: "비밀번호 변경" },
  ];

  return (
    <ErpLayout title="마이페이지">
      {/* 탭 */}
      <div style={{ display: "flex", alignItems: "flex-end", borderBottom: "1px solid var(--erp-line)" }}>
        <div style={{ display: "flex", gap: 4 }}>
          {tabs.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  padding: "10px 16px", border: "none", background: "none", cursor: "pointer",
                  fontSize: 14, fontWeight: active ? 600 : 400,
                  color: active ? "var(--erp-primary)" : "var(--erp-text-muted)",
                  borderBottom: active ? "2px solid var(--erp-primary)" : "2px solid transparent",
                  marginBottom: -1,
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 내 정보 */}
      {tab === "info" && (
      <div className="erp-card" style={{ marginTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>내 정보</span>
          {!editing ? (
            <button className="erp-btn" style={{ height: 30 }} onClick={() => setEditing(true)}>수정</button>
          ) : (
            <div style={{ display: "flex", gap: 6 }}>
              <button className="erp-btn" style={{ height: 30 }} disabled={infoBusy}
                onClick={() => { setEditing(false); load(); }}>취소</button>
              <button className="erp-btn primary" style={{ height: 30 }} disabled={infoBusy} onClick={saveInfo}>저장</button>
            </div>
          )}
        </div>

        <div>
          <Row label="사번">{me ? String(me.empId).padStart(4, "0") : "-"}</Row>
          <Row label="아이디">{me?.loginId ?? cached?.loginId ?? "-"}</Row>
          <Row label="이름">{me?.empName ?? cached?.empName ?? "-"}</Row>
          <Row label="부서">{me?.deptName ?? "-"}</Row>
          <Row label="역할">{roleLabel(me?.roleCode ?? cached?.role ?? "") || "-"}</Row>
          <Row label="입사일">{me?.hireDate?.slice(0, 10) ?? "-"}</Row>

          {/* 연락처·이메일은 본인 수정 가능 */}
          <Row label="전화번호">
            {editing ? (
              <input className="erp-input" style={{ width: "100%", maxWidth: 280 }} value={info.phone}
                onChange={(e) => setInfo((v) => ({ ...v, phone: e.target.value }))} />
            ) : (me?.phone ?? "-")}
          </Row>
          <Row label="이메일" last>
            {editing ? (
              <input type="email" className="erp-input" style={{ width: "100%", maxWidth: 280 }} value={info.email}
                onChange={(e) => setInfo((v) => ({ ...v, email: e.target.value }))} />
            ) : (me?.email ?? "-")}
          </Row>
        </div>
        <p style={{ margin: "10px 0 0", fontSize: 12, color: "var(--erp-text-muted)" }}>
          ※ 이름·부서·역할 변경은 관리자에게 문의하세요.
        </p>
      </div>
      )}

      {/* 비밀번호 변경 */}
      {tab === "password" && (
      <div className="erp-card" style={{ marginTop: 12, maxWidth: 420 }}>
        <p style={{ marginTop: 0, fontSize: 14, fontWeight: 600, color: "var(--erp-text)" }}>비밀번호 변경</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
          <input type="password" className="erp-input" placeholder="현재 비밀번호" value={pw.currentPassword}
            onChange={(e) => setPw((v) => ({ ...v, currentPassword: e.target.value }))} />
          <input type="password" className="erp-input" placeholder="새 비밀번호 (8자 이상)" value={pw.newPassword}
            onChange={(e) => setPw((v) => ({ ...v, newPassword: e.target.value }))} />
          <input type="password" className="erp-input" placeholder="새 비밀번호 확인" value={pw.checkNewPassword}
            onChange={(e) => setPw((v) => ({ ...v, checkNewPassword: e.target.value }))} />
          {pwError && <p className="erp-warn-text" style={{ margin: 0 }}>{pwError}</p>}
          <button className="erp-btn primary" disabled={pwBusy || !pw.currentPassword || !pw.newPassword}
            onClick={changePassword}>
            {pwBusy ? "변경 중..." : "비밀번호 변경"}
          </button>
        </div>
      </div>
      )}
    </ErpLayout>
  );
}
