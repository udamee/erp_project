"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { departmentApi, type Department } from "@/lib/api";
import { authApi } from "@/lib/auth-api";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    loginId: "",
    password: "",
    empName: "",
    deptId: "",
    email: "",
    phone: "",
  });
  const [depts, setDepts] = useState<Department[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 부서 목록 로드 (회원가입 폼은 비인증 상태라 permitAll API 사용)
  useEffect(() => {
    departmentApi
      .list()
      .then(setDepts)
      .catch((err) => setError((err as Error).message));
  }, []);

  const update = (key: keyof typeof form) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!form.deptId) {
      setError("부서를 선택해주세요.");
      return;
    }

    setLoading(true);
    try {
      await authApi.signup({
        loginId: form.loginId,
        password: form.password,
        empName: form.empName,
        deptId: Number(form.deptId),
        email: form.email,
        phone: form.phone,
      });
      alert("가입 신청이 완료되었습니다. 관리자 승인 후 로그인할 수 있습니다.");
      router.push("/login");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="회원가입"
      subtitle="가입 후 관리자 승인이 필요합니다"
      onSubmit={handleSignup}
      footer={
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--erp-text-muted)", textAlign: "center" }}>
          이미 계정이 있으신가요?{" "}
          <Link href="/login" style={{ color: "var(--erp-primary)", fontWeight: 600 }}>
            로그인
          </Link>
        </p>
      }
    >
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 6px" }}>아이디</p>
        <input className="erp-input" style={{ width: "100%" }} value={form.loginId} onChange={update("loginId")} placeholder="아이디를 입력하세요" />
      </div>

      <div>
        <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 6px" }}>비밀번호</p>
        <input type="password" className="erp-input" style={{ width: "100%" }} value={form.password} onChange={update("password")} placeholder="비밀번호를 입력하세요" />
      </div>

      <div>
        <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 6px" }}>이름</p>
        <input className="erp-input" style={{ width: "100%" }} value={form.empName} onChange={update("empName")} placeholder="이름을 입력하세요" />
      </div>

      <div>
        <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 6px" }}>부서</p>
        <select className="erp-select" style={{ width: "100%" }} value={form.deptId} onChange={update("deptId")}>
          <option value="">부서를 선택하세요</option>
          {depts.map((d) => (
            <option key={d.deptId} value={d.deptId}>
              {d.deptName}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 6px" }}>이메일</p>
        <input type="email" className="erp-input" style={{ width: "100%" }} value={form.email} onChange={update("email")} placeholder="이메일을 입력하세요" />
      </div>

      <div>
        <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 6px" }}>전화번호</p>
        <input className="erp-input" style={{ width: "100%" }} value={form.phone} onChange={update("phone")} placeholder="전화번호를 입력하세요" />
      </div>

      {error && <p className="erp-warn-text" style={{ margin: 0 }}>{error}</p>}

      <button type="submit" className="erp-btn primary" disabled={loading} style={{ width: "100%", height: 40 }}>
        {loading ? "가입 신청 중..." : "가입 신청"}
      </button>
    </AuthShell>
  );
}
