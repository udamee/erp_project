"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ErpLayout from "@/components/ErpLayout";
import EmployeeStatusBadge, { roleLabel } from "@/components/EmployeeStatusBadge";
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
  const [tab, setTab] = useState<"active" | "pending">("active");

  const [depts, setDepts] = useState<Department[]>([]);
  const [cond, setCond] = useState<EmployeeSearchCondition>({});
  const [list, setList] = useState<Employee[]>([]);
  const [pending, setPending] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    departmentApi.list().then(setDepts).catch(() => {});
  }, []);

  const loadList = useCallback(() => {
    setLoading(true);
    setError("");
    employeeApi
      .list(cond)
      .then(setList)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [cond]);

  const loadPending = useCallback(() => {
    setLoading(true);
    setError("");
    adminEmployeeApi
      .pending()
      .then(setPending)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab === "active") loadList();
    else loadPending();
  }, [tab, loadList, loadPending]);

  const handleApprove = async (empId: number) => {
    if (!confirm("이 직원의 가입을 승인하시겠습니까?")) return;
    try {
      await adminEmployeeApi.approve(empId);
      loadPending();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleReject = async (empId: number) => {
    if (!confirm("이 직원의 가입을 거절하시겠습니까?")) return;
    try {
      await adminEmployeeApi.reject(empId);
      loadPending();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <ErpLayout title="직원 관리">
      {/* 탭 */}
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--erp-line)" }}>
        {([
          { key: "active", label: "재직 직원" },
          { key: "pending", label: "승인 대기", count: pending.length },
        ] as const).map((t) => {
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
            onKeyDown={(e) => e.key === "Enter" && loadList()}
            style={{ flex: 1, maxWidth: 220 }}
          />
          <button className="erp-btn" onClick={loadList}>검색</button>
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
              {loading ? (
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
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 40 }}>불러오는 중...</td></tr>
              ) : pending.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 40 }}>승인 대기 중인 직원이 없습니다.</td></tr>
              ) : (
                pending.map((e) => (
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
