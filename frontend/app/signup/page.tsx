"use client";

import { useEffect, useState, type ChangeEvent, type SubmitEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi, departmentApi, type Department } from "@/lib/api";

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

  const handleSignup = async (e: SubmitEvent<HTMLFormElement>) => {
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
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f7fa", padding: "24px 0" }}>
      <form onSubmit={handleSignup} style={{ width: 360, background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 32, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "#1d9e75", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700 }}>약</div>
          <h2 style={{ margin: "10px 0 0", fontSize: 18 }}>회원가입</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>가입 후 관리자 승인이 필요합니다</p>
        </div>

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
          <select className="erp-input" style={{ width: "100%" }} value={form.deptId} onChange={update("deptId")}>
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

        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280", textAlign: "center" }}>
          이미 계정이 있으신가요?{" "}
          <Link href="/login" style={{ color: "#1d9e75", fontWeight: 600 }}>
            로그인
          </Link>
        </p>
      </form>
    </div>
  );
}
