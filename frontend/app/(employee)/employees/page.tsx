"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SafetyCertificateOutlined } from "@ant-design/icons";
import ErpLayout from "@/components/ErpLayout";
import EmployeeStatusBadge, { roleLabel } from "@/components/EmployeeStatusBadge";
import { useAsyncData, useAuthUser } from "@/lib/hooks";
import {
  adminEmployeeApi,
  departmentApi,
  employeeApi,
  type Department,
  type Employee,
  type EmployeeSearchCondition,
} from "@/lib/api";

const ROLES = [
  { key: "", label: "전체 역할" },
  { key: "STAFF", label: "사원" },
  { key: "MANAGER", label: "매니저" },
  { key: "ADMIN", label: "관리자" },
];

export default function EmployeeListPage() {
  const router = useRouter();
  const user = useAuthUser();
  const role = user?.role ?? "";
  const isAdmin = role === "ADMIN";
  // 직원 관리 = 인사부 매니저 + 관리자 (백엔드 권한 기준과 일치)
  const canManage = isAdmin || (role === "MANAGER" && user?.deptCode === "DEPT_HR");

  const [tab, setTab] = useState<"active" | "pending">("active");
  const [depts, setDepts] = useState<Department[]>([]);

  // cond: 입력 중 값 / committed: 실제 조회에 반영된 값(검색 버튼·Enter로 확정)
  const [cond, setCond] = useState<EmployeeSearchCondition>({});
  const [committed, setCommitted] = useState<EmployeeSearchCondition>({});

  // 권한 없는 사용자는 admin API를 호출하지 않도록 빈 결과로 단락 처리
  const active = useAsyncData(
    () => (canManage ? employeeApi.list(committed) : Promise.resolve([] as Employee[])),
    [committed, canManage],
  );
  const pending = useAsyncData(
    () => (canManage ? adminEmployeeApi.pending() : Promise.resolve([] as Employee[])),
    [canManage],
  );

  useEffect(() => {
    departmentApi.list().then(setDepts).catch(() => {});
  }, []);

  const list = active.data ?? [];
  const pendingList = pending.data ?? [];
  const error = active.error || pending.error;

  const search = () => setCommitted({ ...cond });

  const handleApprove = async (empId: number) => {
    if (!confirm("이 직원의 가입을 승인하시겠습니까?")) return;
    try {
      await adminEmployeeApi.approve(empId);
      pending.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleReject = async (empId: number) => {
    if (!confirm("이 직원의 가입을 거절하시겠습니까?")) return;
    try {
      await adminEmployeeApi.reject(empId);
      pending.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  if (!canManage) {
    return (
      <ErpLayout title="직원 관리">
        <div className="erp-card" style={{ textAlign: "center", padding: 48 }}>
          <SafetyCertificateOutlined style={{ fontSize: 40, color: "var(--erp-text-muted)" }} />
          <h3 style={{ margin: "12px 0 4px" }}>접근 권한이 없습니다</h3>
          <p style={{ margin: 0, color: "var(--erp-text-muted)" }}>
            직원 관리는 인사팀 매니저 또는 관리자만 접근할 수 있습니다.
          </p>
        </div>
      </ErpLayout>
    );
  }

  return (
    <ErpLayout title="직원 관리">
      {/* 탭 */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", borderBottom: "1px solid var(--erp-line)" }}>
        <div style={{ display: "flex", gap: 4 }}>
          {([
            { key: "active", label: "재직 직원" },
            { key: "pending", label: "승인 대기", count: pendingList.length },
          ] as const).map((t) => {
            const tabActive = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  padding: "10px 16px", border: "none", background: "none", cursor: "pointer",
                  fontSize: 14, fontWeight: tabActive ? 600 : 400,
                  color: tabActive ? "var(--erp-primary)" : "var(--erp-text-muted)",
                  borderBottom: tabActive ? "2px solid var(--erp-primary)" : "2px solid transparent",
                  marginBottom: -1,
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        {isAdmin && (
          <button className="erp-btn primary" style={{ height: 32, marginBottom: 6 }}
            onClick={() => router.push("/employees/new")}>
            + 직원 등록
          </button>
        )}
      </div>

      {/* 검색 (재직 탭) */}
      {tab === "active" && (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select
            className="erp-select"
            value={cond.deptId ?? ""}
            onChange={(e) => setCond((c) => ({ ...c, deptId: e.target.value ? Number(e.target.value) : undefined }))}
          >
            <option value="">전체 부서</option>
            {depts.map((d) => (
              <option key={d.deptId} value={d.deptId}>{d.deptName}</option>
            ))}
          </select>
          <select
            className="erp-select"
            value={cond.roleCode ?? ""}
            onChange={(e) => setCond((c) => ({ ...c, roleCode: e.target.value || undefined }))}
          >
            {ROLES.map((r) => (
              <option key={r.key} value={r.key}>{r.label}</option>
            ))}
          </select>
          <input
            className="erp-input"
            placeholder="이름 검색"
            value={cond.empName ?? ""}
            onChange={(e) => setCond((c) => ({ ...c, empName: e.target.value || undefined }))}
            onKeyDown={(e) => e.key === "Enter" && search()}
            style={{ flex: 1, maxWidth: 220 }}
          />
          <button className="erp-btn" onClick={search}>검색</button>
        </div>
      )}

      {error && <p className="erp-warn-text">{error}</p>}

      {/* 재직 직원 테이블 */}
      {tab === "active" && (
        <div className="erp-table-wrap">
          <table className="erp-table">
            <thead>
              <tr>
                <th>사번</th><th>아이디</th><th>이름</th><th>부서</th><th>역할</th><th>상태</th><th>입사일</th>
              </tr>
            </thead>
            <tbody>
              {active.loading ? (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: 40 }}>불러오는 중...</td></tr>
              ) : list.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: 40 }}>직원이 없습니다.</td></tr>
              ) : (
                list.map((e) => (
                  <tr key={e.empId} onClick={() => router.push(`/employees/${e.empId}`)}>
                    <td className="link">{String(e.empId).padStart(4, "0")}</td>
                    <td>{e.loginId}</td>
                    <td>{e.empName}</td>
                    <td>{e.deptName ?? "-"}</td>
                    <td>{roleLabel(e.roleCode)}</td>
                    <td><EmployeeStatusBadge status={e.status} /></td>
                    <td>{e.hireDate?.slice(0, 10) ?? "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 승인 대기 테이블 */}
      {tab === "pending" && (
        <div className="erp-table-wrap">
          <table className="erp-table">
            <thead>
              <tr>
                <th>사번</th><th>아이디</th><th>이름</th><th>부서</th><th>이메일</th><th style={{ textAlign: "right" }}>처리</th>
              </tr>
            </thead>
            <tbody>
              {pending.loading ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 40 }}>불러오는 중...</td></tr>
              ) : pendingList.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 40 }}>승인 대기 중인 직원이 없습니다.</td></tr>
              ) : (
                pendingList.map((e) => (
                  <tr key={e.empId} style={{ cursor: "default" }}>
                    <td>{String(e.empId).padStart(4, "0")}</td>
                    <td>{e.loginId}</td>
                    <td>{e.empName}</td>
                    <td>{e.deptName ?? "-"}</td>
                    <td>{e.email ?? "-"}</td>
                    <td style={{ textAlign: "right" }}>
                      <button className="erp-btn primary" style={{ height: 30, marginRight: 6 }} onClick={() => handleApprove(e.empId)}>승인</button>
                      <button className="erp-btn danger-outline" style={{ height: 30 }} onClick={() => handleReject(e.empId)}>거절</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </ErpLayout>
  );
}
