"use client";

import { useEffect, useState } from "react";
import ErpLayout from "@/components/ErpLayout";
import { userStorage } from "@/lib/api";
import MyAttendance from "./MyAttendance";
import AdminAttendance from "./AdminAttendance";

export default function AttendancePage() {
  const [tab, setTab] = useState<"my" | "admin">("my");
  const [isManager, setIsManager] = useState(false);
  const [absenceOpen, setAbsenceOpen] = useState(false);

  useEffect(() => {
    const role = userStorage.get()?.role;
    setIsManager(role === "MANAGER" || role === "ADMIN");
  }, []);

  const tabs = [
    { key: "my" as const, label: "내 근태", show: true },
    { key: "admin" as const, label: "전체 근태", show: isManager },
  ].filter((t) => t.show);

  return (
    <ErpLayout title="근태 관리">
      {/* 탭 (오른쪽에 전체 근태일 때만 결근/휴가 등록 버튼) */}
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
        {tab === "admin" && isManager && (
          <button
            className="erp-btn primary"
            style={{ marginLeft: "auto", marginBottom: 6, height: 32, fontSize: 13 }}
            onClick={() => setAbsenceOpen(true)}
          >
            + 결근 / 휴가 등록
          </button>
        )}
      </div>

      {tab === "admin" && isManager ? (
        <AdminAttendance absenceOpen={absenceOpen} onAbsenceClose={() => setAbsenceOpen(false)} />
      ) : (
        <MyAttendance />
      )}
    </ErpLayout>
  );
}
