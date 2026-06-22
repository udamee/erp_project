"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { authApi, tokenStorage, userStorage } from "@/lib/api";

const MENUS = [
  { href: "/", label: "홈" },
  { href: "/employees", label: "직원 관리" },
  { href: "/attendance", label: "근태 관리" },
  { href: "/customers", label: "거래처 관리" },
  { href: "/products", label: "의약품 관리" },
  { href: "/purchase-orders", label: "입고 / 승인" },
  { href: "/inventory", label: "출고 / 재고" },
  { href: "/settlement", label: "정산 / 매출" },
  { href: "/ai", label: "AI 분석" },
];

export default function ErpLayout({ title, children, back }: { title: string; children: ReactNode; back?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [empName, setEmpName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [authed, setAuthed] = useState(false);

  // 라우트 가드: 토큰 없으면 로그인으로. 있으면 사용자명 세팅 후 렌더 허용.
  useEffect(() => {
    if (!tokenStorage.get()) {
      router.replace("/login");
      return;
    }
    const user = userStorage.get();
    setEmpName(user?.empName ?? "사용자");
    setIsAdmin(user?.role === "ADMIN");
    setAuthed(true);
  }, [router]);

  // 로그아웃: 서버 쿠키/리프레시 토큰 정리까지 호출
  const handleLogout = async () => {
    if (!confirm("로그아웃 하시겠습니까?")) return;
    await authApi.logout().catch(() => {}); // 서버 실패해도 클라이언트 세션은 정리
    tokenStorage.clear();
    userStorage.clear();
    router.push("/login");
  };

  // 가드 통과 전에는 보호 콘텐츠를 그리지 않음
  if (!authed) return null;

  return (
    <div className="erp-layout">
      <aside className="erp-sidebar">
        <div className="erp-logo">
          <span className="erp-logo-mark">약</span>
          약통 ERP
        </div>
        <nav className="erp-menu">
          {MENUS.map((menu) => (
            <Link
              key={menu.href}
              href={menu.href}
              className={(menu.href === "/" ? pathname === "/" : pathname.startsWith(menu.href)) ? "active" : ""}
            >
              {menu.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="erp-main">
        <header className="erp-header">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {back && (
              <button
                onClick={() => router.back()}
                aria-label="뒤로"
                title="뒤로"
                className="erp-back-btn"
              >
                <ArrowLeftOutlined />
              </button>
            )}
            <h1>{title}</h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {isAdmin && (
              <span style={{
                fontSize: 12, fontWeight: 600, color: "var(--erp-primary-dark)",
                background: "var(--erp-primary-bg)", padding: "2px 8px", borderRadius: 6,
              }}>
                관리자
              </span>
            )}
            <span className="erp-user">{empName} 님</span>
            <span style={{ width: 1, height: 16, background: "var(--erp-line)" }} />
            <Link
              href="/mypage"
              className="erp-user"
              style={{ textDecoration: "none", cursor: "pointer" }}
            >
              My Page
            </Link>
            <span style={{ width: 1, height: 16, background: "var(--erp-line)" }} />
            <button
              className="erp-user"
              style={{ border: "none", background: "none", padding: 0, cursor: "pointer" }}
              onClick={handleLogout}
            >
              로그아웃
            </button>
          </div>
        </header>
        <main className="erp-content">{children}</main>
      </div>
    </div>
  );
}
