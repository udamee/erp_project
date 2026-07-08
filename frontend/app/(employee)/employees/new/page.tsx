"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftOutlined } from "@ant-design/icons";
import ErpLayout from "@/components/ErpLayout";
import {
  departmentApi,
  employeeApi,
  type Department,
  type EmployeeCreateInput,
  type RoleCode,
} from "@/lib/api";
import { useRole } from "@/lib/hooks";

// 라벨-입력 한 줄
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, minHeight: 52 }}>
      <span style={{ width: 96, flexShrink: 0, fontSize: 13, color: "var(--erp-text-muted)" }}>
        {label}{required && <span style={{ color: "var(--erp-danger)" }}> *</span>}
      </span>
      <div style={{ flex: 1, maxWidth: 320 }}>{children}</div>
    </div>
  );
}

export default function EmployeeCreatePage() {
  const router = useRouter();

  const isAdmin = useRole() === "ADMIN";
  const [depts, setDepts] = useState<Department[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    loginId: "",
    password: "",
    empName: "",
    deptId: "",
    phone: "",
    email: "",
    roleCode: "STAFF" as RoleCode,
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
    hireDate: "",
  });

  useEffect(() => {
    departmentApi.list().then(setDepts).catch(() => {});
  }, []);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    setError("");
    if (!form.loginId.trim() || !form.password.trim() || !form.empName.trim() || !form.deptId) {
      setError("아이디·비밀번호·이름·부서는 필수입니다.");
      return;
    }
    if (form.password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    const payload: EmployeeCreateInput = {
      loginId: form.loginId.trim(),
      password: form.password,
      empName: form.empName.trim(),
      deptId: Number(form.deptId),
      phone: form.phone || undefined,
      email: form.email || undefined,
      roleCode: form.roleCode,
      status: form.status,
      hireDate: form.hireDate || undefined,
    };

    setBusy(true);
    try {
      const empId = await employeeApi.create(payload);
      alert("직원이 등록되었습니다.");
      router.push(`/employees/${empId}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!isAdmin) {
    return (
      <ErpLayout title="직원 등록">
        <div className="erp-card" style={{ textAlign: "center", padding: 48 }}>
          <h3 style={{ margin: "0 0 4px" }}>관리자 전용 기능입니다</h3>
          <p style={{ margin: 0, color: "var(--erp-text-muted)" }}>직원 직접 등록은 관리자만 가능합니다.</p>
          <button className="erp-btn" style={{ marginTop: 16 }} onClick={() => router.push("/employees")}>
            직원 목록으로
          </button>
        </div>
      </ErpLayout>
    );
  }

  return (
    <ErpLayout title="직원 등록">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <button onClick={() => router.back()} aria-label="목록으로" title="목록으로" className="erp-back-btn">
          <ArrowLeftOutlined />
        </button>
        <h2 style={{ margin: 0, fontSize: 18 }}>직원 직접 등록</h2>
      </div>

      <div className="erp-card" style={{ maxWidth: 480 }}>
        <p style={{ margin: "0 0 12px", fontSize: 12, color: "var(--erp-text-muted)" }}>
          ※ 승인 절차 없이 바로 재직 상태로 생성됩니다. 일반 입사자는 회원가입 후 승인 절차를 이용하세요.
        </p>

        <Field label="아이디" required>
          <input className="erp-input" style={{ width: "100%" }} value={form.loginId}
            onChange={(e) => set("loginId", e.target.value)} placeholder="로그인 아이디" />
        </Field>
        <Field label="비밀번호" required>
          <input type="password" className="erp-input" style={{ width: "100%" }} value={form.password}
            onChange={(e) => set("password", e.target.value)} placeholder="8자 이상" />
        </Field>
        <Field label="이름" required>
          <input className="erp-input" style={{ width: "100%" }} value={form.empName}
            onChange={(e) => set("empName", e.target.value)} placeholder="직원 이름" />
        </Field>
        <Field label="부서" required>
          <select className="erp-select" style={{ width: "100%" }} value={form.deptId}
            onChange={(e) => set("deptId", e.target.value)}>
            <option value="">부서를 선택하세요</option>
            {depts.map((d) => <option key={d.deptId} value={d.deptId}>{d.deptName}</option>)}
          </select>
        </Field>
        <Field label="역할">
          <select className="erp-select" style={{ width: "100%" }} value={form.roleCode}
            onChange={(e) => set("roleCode", e.target.value as RoleCode)}>
            <option value="STAFF">사원</option>
            <option value="MANAGER">매니저</option>
            <option value="ADMIN">관리자</option>
          </select>
        </Field>
        <Field label="계정 상태">
          <select className="erp-select" style={{ width: "100%" }} value={form.status}
            onChange={(e) => set("status", e.target.value as "ACTIVE" | "INACTIVE")}>
            <option value="ACTIVE">재직</option>
            <option value="INACTIVE">비활성</option>
          </select>
        </Field>
        <Field label="전화번호">
          <input className="erp-input" style={{ width: "100%" }} value={form.phone}
            onChange={(e) => set("phone", e.target.value)} placeholder="선택" />
        </Field>
        <Field label="이메일">
          <input type="email" className="erp-input" style={{ width: "100%" }} value={form.email}
            onChange={(e) => set("email", e.target.value)} placeholder="선택" />
        </Field>
        <Field label="입사일">
          <input type="date" className="erp-input" style={{ width: "100%" }} value={form.hireDate}
            onChange={(e) => set("hireDate", e.target.value)} />
        </Field>

        {error && <p className="erp-warn-text" style={{ marginTop: 12 }}>{error}</p>}

        <div className="erp-page-actions">
          <button className="erp-btn" onClick={() => router.push("/employees")} disabled={busy}>취소</button>
          <button className="erp-btn primary" onClick={submit} disabled={busy}>
            {busy ? "등록 중..." : "등록"}
          </button>
        </div>
      </div>
    </ErpLayout>
  );
}
