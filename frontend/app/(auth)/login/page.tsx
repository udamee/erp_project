"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { authApi } from "@/lib/auth-api";
import { tokenStorage, userStorage } from "@/lib/api-client";

export default function LoginPage() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await authApi.login(loginId, password);
      tokenStorage.set(data.accessToken);
      userStorage.set(data);
      router.push("/dashboard");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="약통 ERP"
      subtitle="의약품 유통 관리 시스템"
      onSubmit={handleLogin}
      footer={
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--erp-text-muted)", textAlign: "center" }}>
          계정이 없으신가요?{" "}
          <Link href="/signup" style={{ color: "var(--erp-primary)", fontWeight: 600 }}>
            회원가입
          </Link>
        </p>
      }
    >
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 6px" }}>아이디</p>
        <input
          className="erp-input"
          style={{ width: "100%" }}
          value={loginId}
          onChange={(e) => setLoginId(e.target.value)}
          placeholder="아이디를 입력하세요"
        />
      </div>

      <div>
        <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 6px" }}>비밀번호</p>
        <input
          type="password"
          className="erp-input"
          style={{ width: "100%" }}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호를 입력하세요"
        />
      </div>

      {error && <p className="erp-warn-text" style={{ margin: 0 }}>{error}</p>}

      <button type="submit" className="erp-btn primary" disabled={loading} style={{ width: "100%", height: 40 }}>
        {loading ? "로그인 중..." : "로그인"}
      </button>
    </AuthShell>
  );
}
