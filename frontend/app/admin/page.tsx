"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  SafetyCertificateOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  MedicineBoxOutlined,
} from "@ant-design/icons";
import ErpLayout from "@/components/ErpLayout";
import {
  adminEmployeeApi,
  employeeApi,
  type Employee,
} from "@/lib/api";
import { userStorage } from "@/lib/api-client";

// 통계 카드
function StatCard({
  label, value, accent,
}: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className="erp-card" style={{ flex: 1, minWidth: 180 }}>
      <p style={{ margin: 0, fontSize: 13, color: "var(--erp-text-muted)" }}>{label}</p>
      <strong style={{ fontSize: 26, color: accent ? "var(--erp-danger)" : "var(--erp-text)" }}>
        {value}
      </strong>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const cached = typeof window !== "undefined" ? userStorage.get() : null;

  const [me, setMe] = useState<Employee | null>(null);
  const [pending, setPending] = useState<Employee[]>([]);
  const [activeCount, setActiveCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const role = me?.roleCode ?? cached?.role ?? "STAFF";
  const isAdmin = role === "ADMIN";
  const isManager = role === "MANAGER" || isAdmin;
  // 직원 관리 권한은 인사부 매니저 + 관리자 (백엔드 권한 기준과 일치)
  const isHR = isAdmin || (role === "MANAGER" && cached?.deptCode === "DEPT_HR");
  const canAccess = isManager;

  useEffect(() => {
    employeeApi.me()
      .then(setMe)
      .catch(() => {});
  }, []);

  const loadHr = useCallback(() => {
    if (!isHR) return;
    adminEmployeeApi.pending().then(setPending).catch(() => {});
    employeeApi.list().then((l) => setActiveCount(l.length)).catch(() => {});
  }, [isHR]);

  useEffect(loadHr, [loadHr]);

  const handle = async (fn: () => Promise<void>, confirmMsg: string) => {
    if (!confirm(confirmMsg)) return;
    setBusy(true);
    try {
      await fn();
      loadHr();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const links = useMemo(() => {
    const arr: { href: string; label: string; desc: string; Icon: React.ComponentType }[] = [];
    if (isHR)
      arr.push({ href: "/employees", label: "직원 관리", desc: "직원 조회·승인·역할·계정 관리", Icon: TeamOutlined });
    if (isManager)
      arr.push({ href: "/attendance", label: "근태 관리", desc: "전체 근태 조회·보정·결근/휴가 등록", Icon: ClockCircleOutlined });
    arr.push({ href: "/product", label: "상품 관리", desc: "상품 마스터 조회·동기화", Icon: MedicineBoxOutlined });
    return arr;
  }, [isHR, isManager]);

  if (!canAccess) {
    return (
      <ErpLayout title="관리자">
        <div className="erp-card" style={{ textAlign: "center", padding: 48 }}>
          <SafetyCertificateOutlined style={{ fontSize: 40, color: "var(--erp-text-muted)" }} />
          <h3 style={{ margin: "12px 0 4px" }}>관리자 전용 페이지입니다</h3>
          <p style={{ margin: 0, color: "var(--erp-text-muted)" }}>
            이 페이지는 관리자·매니저 또는 인사팀만 접근할 수 있습니다.
          </p>
        </div>
      </ErpLayout>
    );
  }

  return (
    <ErpLayout title="관리자">
      {/* 헤더 배너 */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", marginBottom: 12,
        background: "var(--erp-primary-bg)", borderRadius: 10,
      }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700,
          color: "#fff", background: "var(--erp-primary)", padding: "3px 10px", borderRadius: 6,
        }}>
          <SafetyCertificateOutlined /> 관리자 콘솔
        </span>
        <span style={{ fontSize: 13, color: "var(--erp-primary-dark)" }}>
          직원·근태·상품 관리 기능을 한 곳에서 빠르게 처리합니다.
        </span>
      </div>

      {/* 통계 */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {isHR && <StatCard label="가입 승인 대기" value={`${pending.length}명`} accent={pending.length > 0} />}
        {isHR && <StatCard label="재직 직원" value={activeCount != null ? `${activeCount}명` : "-"} />}
        <StatCard label="내 권한" value={isAdmin ? "관리자" : isManager ? "매니저" : "인사팀"} />
      </div>

      {/* 가입 승인 대기 (HR·ADMIN) */}
      {isHR && (
        <div className="erp-card" style={{ marginTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>가입 승인 대기</span>
            <button className="erp-btn" style={{ height: 30 }} onClick={() => router.push("/employees")}>
              직원 관리로 이동
            </button>
          </div>
          <div className="erp-table-wrap">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>사번</th><th>아이디</th><th>이름</th><th>부서</th><th>이메일</th>
                  <th style={{ textAlign: "right" }}>처리</th>
                </tr>
              </thead>
              <tbody>
                {pending.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: 32 }}>승인 대기 중인 직원이 없습니다.</td></tr>
                ) : (
                  pending.map((e) => (
                    <tr key={e.empId} style={{ cursor: "default" }}>
                      <td>{String(e.empId).padStart(4, "0")}</td>
                      <td>{e.loginId}</td>
                      <td>{e.empName}</td>
                      <td>{e.deptName ?? "-"}</td>
                      <td>{e.email ?? "-"}</td>
                      <td style={{ textAlign: "right" }}>
                        <button className="erp-btn primary" style={{ height: 30, marginRight: 6 }} disabled={busy}
                          onClick={() => handle(() => adminEmployeeApi.approve(e.empId), "이 직원의 가입을 승인하시겠습니까?")}>
                          승인
                        </button>
                        <button className="erp-btn danger-outline" style={{ height: 30 }} disabled={busy}
                          onClick={() => handle(() => adminEmployeeApi.reject(e.empId), "이 직원의 가입을 거절하시겠습니까?")}>
                          거절
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 빠른 메뉴 */}
      <div className="erp-card" style={{ marginTop: 12 }}>
        <p style={{ marginTop: 0, fontSize: 14, fontWeight: 600 }}>관리 메뉴</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, marginTop: 8 }}>
          {links.map(({ href, label, desc, Icon }) => (
            <button
              key={href}
              onClick={() => router.push(href)}
              className="erp-card"
              style={{
                textAlign: "left", cursor: "pointer", border: "1px solid var(--erp-line)",
                display: "flex", gap: 12, alignItems: "center", padding: 14,
              }}
            >
              <span style={{
                width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                background: "var(--erp-primary-bg)", color: "var(--erp-primary-dark)",
                display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 18,
              }}>
                <Icon />
              </span>
              <span>
                <span style={{ display: "block", fontWeight: 600, fontSize: 14 }}>{label}</span>
                <span style={{ display: "block", fontSize: 12, color: "var(--erp-text-muted)", marginTop: 2 }}>{desc}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </ErpLayout>
  );
}
