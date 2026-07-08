"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeftOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import ErpLayout from "@/components/ErpLayout";
import EmployeeStatusBadge, { roleLabel } from "@/components/EmployeeStatusBadge";
import {
  adminEmployeeApi,
  departmentApi,
  employeeApi,
  type Department,
  type Employee,
  type RoleCode,
} from "@/lib/api";
import { useRole } from "@/lib/hooks";

// 위→아래 라벨-값(또는 입력) 리스트 한 줄
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

export default function EmployeeDetailPage() {
  const { empId } = useParams<{ empId: string }>();
  const router = useRouter();
  const [emp, setEmp] = useState<Employee | null>(null);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  const isAdmin = useRole() === "ADMIN";
  const [depts, setDepts] = useState<Department[]>([]);

  // 관리자 작업 입력 상태
  const [roleDraft, setRoleDraft] = useState<RoleCode>("STAFF");
  const [newPw, setNewPw] = useState("");
  const [form, setForm] = useState({ empName: "", phone: "", email: "", deptId: "", hireDate: "" });

  const load = useCallback(() => {
    employeeApi
      .detail(Number(empId))
      .then((e) => {
        setEmp(e);
        setRoleDraft(e.roleCode);
        setForm({
          empName: e.empName ?? "",
          phone: e.phone ?? "",
          email: e.email ?? "",
          deptId: e.deptId != null ? String(e.deptId) : "",
          hireDate: e.hireDate?.slice(0, 10) ?? "",
        });
      })
      .catch((e: Error) => setError(e.message));
  }, [empId]);

  useEffect(load, [load]);

  useEffect(() => {
    departmentApi.list().then(setDepts).catch(() => {});
  }, []);

  const run = async (fn: () => Promise<void>, confirmMsg: string, after: "reload" | "back") => {
    if (confirmMsg && !confirm(confirmMsg)) return;
    setProcessing(true);
    try {
      await fn();
      if (after === "back") router.push("/employees");
      else load();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  if (error) {
    return (
      <ErpLayout title="직원 상세" back>
        <p className="erp-warn-text">{error}</p>
      </ErpLayout>
    );
  }

  if (!emp) {
    return <ErpLayout title="직원 상세" back><p>불러오는 중...</p></ErpLayout>;
  }

  return (
    <ErpLayout title="직원 상세">
      {/* 프로필 헤더 */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button
          onClick={() => router.back()}
          aria-label="목록으로"
          title="목록으로"
          className="erp-back-btn"
        >
          <ArrowLeftOutlined />
        </button>

        {/* 이니셜 아바타 */}
        <div style={{
          width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
          background: "var(--erp-primary-bg)", color: "var(--erp-primary-dark)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, fontWeight: 700,
        }}>
          {emp.empName?.charAt(0) ?? "?"}
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>{emp.empName}</h2>
            <EmployeeStatusBadge status={emp.status} />
          </div>
          <p style={{ margin: "3px 0 0", fontSize: 13, color: "var(--erp-text-muted)" }}>
            {emp.deptName ?? "부서 미지정"} · {roleLabel(emp.roleCode)} · 사번 {String(emp.empId).padStart(4, "0")}
          </p>
        </div>
      </div>

      <div className="erp-card" style={{ marginTop: 16 }}>
        <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 600 }}>기본 정보</p>
        <Row label="아이디">{emp.loginId}</Row>
        <Row label="역할">{roleLabel(emp.roleCode)}</Row>
        <Row label="부서">{emp.deptName ?? "-"}</Row>
        <Row label="이메일">{emp.email ?? "-"}</Row>
        <Row label="전화번호">{emp.phone ?? "-"}</Row>
        <Row label="입사일">{emp.hireDate?.slice(0, 10) ?? "-"}</Row>
        <Row label="등록일" last>{emp.createdAt?.slice(0, 10) ?? "-"}</Row>
      </div>

      {/* 승인/거절/퇴사 처리 (HR 매니저·ADMIN) */}
      <div className="erp-page-actions">
        {emp.status === "PENDING" ? (
          <>
            <button className="erp-btn danger-outline" disabled={processing}
              onClick={() => run(() => adminEmployeeApi.reject(emp.empId), "이 직원의 가입을 거절하시겠습니까?", "reload")}>
              거절
            </button>
            <button className="erp-btn primary" disabled={processing}
              onClick={() => run(() => adminEmployeeApi.approve(emp.empId), "이 직원의 가입을 승인하시겠습니까?", "reload")}>
              승인
            </button>
          </>
        ) : (emp.status !== "TERMINATED" && emp.roleCode !== "ADMIN") ? (
          <button className="erp-btn danger" disabled={processing}
            onClick={() => run(() => adminEmployeeApi.remove(emp.empId), "이 직원을 퇴사 처리하시겠습니까?\n계정이 비활성화되고 로그인 아이디가 영구 무효화됩니다(복구 불가).", "back")}>
            퇴사 처리
          </button>
        ) : null}
      </div>

      {/* ===== ADMIN 전용 계정·권한 관리 ===== */}
      {isAdmin && (
        <div style={{ marginTop: 20, border: "1.5px solid var(--erp-primary)", borderRadius: 10, overflow: "hidden" }}>
          {/* 관리자 권한 배너 — HR보다 많은 권한을 한눈에 */}
          <div style={{ background: "var(--erp-primary-bg)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: "#fff", background: "var(--erp-primary)", padding: "3px 10px", borderRadius: 6 }}>
              <SafetyCertificateOutlined /> 관리자 전용
            </span>
            <span style={{ fontSize: 13, color: "var(--erp-primary-dark)" }}>HR 권한에 더해 직원 정보 수정·역할 변경·계정 잠금·비밀번호 초기화가 가능합니다.</span>
          </div>

          <div style={{ background: "#fff", padding: 16, display: "flex", flexDirection: "column", gap: 18 }}>
          {/* 직원 정보 수정 (토글 없이 바로 편집) */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>직원 정보 수정</span>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="erp-btn" style={{ height: 30 }} disabled={processing}
                  onClick={load}>되돌리기</button>
                <button className="erp-btn primary" style={{ height: 30 }} disabled={processing}
                  onClick={() => run(
                    () => employeeApi.update(emp.empId, {
                      empName: form.empName,
                      phone: form.phone,
                      email: form.email,
                      deptId: form.deptId ? Number(form.deptId) : undefined,
                      hireDate: form.hireDate || undefined,
                    }),
                    "직원 정보를 저장하시겠습니까?", "reload",
                  )}>저장</button>
              </div>
            </div>
            <div>
              <Row label="이름">
                <input className="erp-input" style={{ width: "100%", maxWidth: 280 }} value={form.empName}
                  onChange={(e) => setForm((f) => ({ ...f, empName: e.target.value }))} />
              </Row>
              <Row label="전화번호">
                <input className="erp-input" style={{ width: "100%", maxWidth: 280 }} value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </Row>
              <Row label="이메일">
                <input type="email" className="erp-input" style={{ width: "100%", maxWidth: 280 }} value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </Row>
              <Row label="부서">
                <select className="erp-select" style={{ width: "100%", maxWidth: 280 }} value={form.deptId}
                  onChange={(e) => setForm((f) => ({ ...f, deptId: e.target.value }))}>
                  <option value="">미지정</option>
                  {depts.map((d) => <option key={d.deptId} value={d.deptId}>{d.deptName}</option>)}
                </select>
              </Row>
              <Row label="입사일" last>
                <input type="date" className="erp-input" style={{ width: "100%", maxWidth: 280 }} value={form.hireDate}
                  onChange={(e) => setForm((f) => ({ ...f, hireDate: e.target.value }))} />
              </Row>
            </div>
          </div>

          {/* 역할 변경 */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, width: 110 }}>역할 변경</span>
            <select className="erp-select" value={roleDraft}
              onChange={(e) => setRoleDraft(e.target.value as RoleCode)}>
              <option value="STAFF">사원</option>
              <option value="MANAGER">매니저</option>
              <option value="ADMIN">관리자</option>
            </select>
            <button className="erp-btn" disabled={processing || roleDraft === emp.roleCode}
              onClick={() => run(() => employeeApi.updateRole(emp.empId, roleDraft), `역할을 ${roleLabel(roleDraft)}(으)로 변경하시겠습니까?`, "reload")}>
              적용
            </button>
            <span style={{ fontSize: 12, color: "var(--erp-text-muted)" }}>
              ※ 본인은 다음 로그인 시 반영됩니다.
            </span>
          </div>

          {/* 계정 상태 */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, width: 110 }}>계정 상태</span>
            <EmployeeStatusBadge status={emp.status} />
            {emp.status === "ACTIVE" ? (
              <button className="erp-btn danger-outline" disabled={processing}
                onClick={() => run(() => employeeApi.updateStatus(emp.empId, "INACTIVE"), "계정을 비활성화하시겠습니까? (로그인 불가)", "reload")}>
                비활성화
              </button>
            ) : emp.status === "INACTIVE" ? (
              <button className="erp-btn" disabled={processing}
                onClick={() => run(() => employeeApi.updateStatus(emp.empId, "ACTIVE"), "계정을 활성화하시겠습니까?", "reload")}>
                활성화
              </button>
            ) : (
              <span style={{ fontSize: 12, color: "var(--erp-text-muted)" }}>승인 대기/거절/퇴사 상태에서는 변경 불가</span>
            )}
          </div>

          {/* 비밀번호 초기화 */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, width: 110 }}>비밀번호 초기화</span>
            <input type="password" className="erp-input" placeholder="새 비밀번호" value={newPw}
              onChange={(e) => setNewPw(e.target.value)} style={{ width: 200 }} />
            <button className="erp-btn" disabled={processing || !newPw}
              onClick={() => run(
                () => employeeApi.resetPassword(emp.empId, newPw).then(() => setNewPw("")),
                "이 직원의 비밀번호를 초기화하시겠습니까?", "reload",
              )}>
              초기화
            </button>
          </div>
          </div>
        </div>
      )}
    </ErpLayout>
  );
}
