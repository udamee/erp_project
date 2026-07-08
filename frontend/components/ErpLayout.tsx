"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Avatar, Button, Layout, Space, Spin, Typography } from "antd";
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  HomeOutlined,
  LogoutOutlined,
  MedicineBoxOutlined,
  ReconciliationOutlined,
  SafetyCertificateOutlined,
  ShoppingCartOutlined,
  TruckOutlined,
  UserOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { employeeApi } from "@/lib/api";
import { authApi } from "@/lib/auth-api";
import { tokenStorage, userStorage, type AuthUser } from "@/lib/api-client";
import NotificationBell from "@/components/notification/NotificationBell";
import NotificationDrawer from "@/components/notification/NotificationDrawer";
import RedirectNotice from "@/components/RedirectNotice";
import { NotificationProvider } from "@/app/providers/NotificationProvider";

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

// ===== 접근 정책 모델 (역할 계층 + 부서 — backend/docs/authorization-guide.md 기준) =====
// 역할(Role): STAFF < MANAGER < ADMIN — 계층 있음(상위가 하위 포함)
// 부서(Dept): DEPT_HR / DEPT_SAL / DEPT_LOG / DEPT_FIN — 계층 없음, 상호 배타
//   dept는 하나 또는 여러 부서 허용(배열). 예) 수금 화면 = [DEPT_SAL, DEPT_FIN]
type Access = { minRole?: "STAFF" | "MANAGER" | "ADMIN"; dept?: string | string[] };

const ROLE_RANK: Record<string, number> = { STAFF: 1, MANAGER: 2, ADMIN: 3 };
const roleRank = (r?: string | null) => (r ? ROLE_RANK[r] ?? 0 : 0);

// 역할 계층 + 부서(배타)를 함께 검사한다.
// ADMIN(시스템 관리자)은 부서와 무관하게 모든 화면을 볼 수 있다(UI 편의).
// 부서 스코프 데이터는 백엔드 @PreAuthorize가 최종 통제하므로 UI 게이트만 열어둔다.
function canAccess(access: Access | undefined, user: AuthUser | null): boolean {
  if (!access) return true; // 정책 없는 경로 → 로그인만 되어 있으면 허용
  if (!user) return false;
  if (access.minRole && roleRank(user.role) < roleRank(access.minRole)) return false;
  if (access.dept && user.role !== "ADMIN") {
    const allowed = Array.isArray(access.dept) ? access.dept : [access.dept];
    if (!allowed.includes(user.deptCode ?? "")) return false;
  }
  return true;
}

type MenuItem = {
  href: string;
  label: string;
  icon: ReactNode;
  access?: Access;
};

type MenuGroup = {
  title: string;
  items: MenuItem[];
};

const MENU_GROUPS: MenuGroup[] = [
  {
    title: "기준정보",
    items: [
      { href: "/dashboard", label: "홈", icon: <HomeOutlined /> },
      { href: "/attendance", label: "근태 관리", icon: <CalendarOutlined /> },
      { href: "/customers", label: "거래처 관리", icon: <UserOutlined /> },
      { href: "/product", label: "의약품 관리", icon: <MedicineBoxOutlined /> },
      { href: "/recall-drugs", label: "위해의약품", icon: <SafetyCertificateOutlined /> },
    ],
  },
  {
    title: "구매 / 입고",
    items: [
      { href: "/purchase-orders", label: "발주 관리", icon: <ShoppingCartOutlined />, access: { dept: "DEPT_LOG" } },
      { href: "/purchase-orders/recevings", label: "입고 관리", icon: <TruckOutlined />, access: { dept: "DEPT_LOG" } },
    ],
  },
  {
    title: "재고 / 출고",
    items: [
      { href: "/sales-orders", label: "판매 주문 관리", icon: <ReconciliationOutlined />, access: { dept: "DEPT_SAL" } },
      // 출고·재고 화면은 모두 /api/shipment/** 를 사용 → 물류(DEPT_LOG) 전용 (SecurityConfig 기준)
      { href: "/shipments", label: "출고 관리", icon: <TruckOutlined />, access: { dept: "DEPT_LOG" } },
      { href: "/stock", label: "재고 관리", icon: <MedicineBoxOutlined />, access: { dept: "DEPT_LOG" } },
    ],
  },
  {
    title: "정산 / 분석",
    items: [
      { href: "/settlement/dashboard", label: "매출 대시보드", icon: <WalletOutlined />, access: { dept: "DEPT_FIN" } },
      { href: "/settlement/invoices", label: "매출청구", icon: <WalletOutlined />, access: { dept: "DEPT_FIN" } },
      { href: "/settlement/purchase-invoices", label: "매입청구", icon: <WalletOutlined />, access: { dept: "DEPT_FIN" } },
      { href: "/settlement/receivables", label: "미수금 관리", icon: <WalletOutlined />, access: { dept: ["DEPT_SAL", "DEPT_FIN"] } },
      { href: "/settlement/payables", label: "미지급금 관리", icon: <WalletOutlined />, access: { dept: "DEPT_FIN" } },
      { href: "/settlement/settlements", label: "손익정산", icon: <WalletOutlined />, access: { dept: "DEPT_FIN" } },
    ],
  },
  {
    title: "관리",
    items: [
      { href: "/admin", label: "관리자", icon: <SafetyCertificateOutlined />, access: { minRole: "MANAGER" } },
    ],
  },
];

// ===== 라우트 접근 정책 =====
// 메뉴에 access가 지정된 항목 + 메뉴에 없지만 보호가 필요한 경로를 하나로 합쳐
// "단일 출처(Source of Truth)"로 만든다. → 메뉴 노출과 URL 직접 접근이 어긋나지 않는다.
const EXTRA_ROUTE_POLICIES: { prefix: string; access: Access }[] = [
  // 직원 등록: 인사부 매니저 이상 (authorization-guide.md 4-1 · POST /api/employees)
  { prefix: "/employees/new", access: { minRole: "MANAGER", dept: "DEPT_HR" } },
  // 직원 목록·상세 조회: 인사부 매니저 이상 (EmployeeController: GET = MANAGER+ADMIN and DEPT_HR)
  { prefix: "/employees", access: { minRole: "MANAGER", dept: "DEPT_HR" } },
  // 수금 관리: 영업(수금 업무) + 재무 공통 (SecurityConfig: /api/settlement/payments/** = DEPT_SAL|DEPT_FIN)
  { prefix: "/settlement/payments", access: { dept: ["DEPT_SAL", "DEPT_FIN"] } },
];

const ROUTE_POLICIES = [
  ...MENU_GROUPS.flatMap((group) => group.items)
    .filter((item): item is MenuItem & { access: Access } => !!item.access)
    .map((item) => ({ prefix: item.href, access: item.access })),
  ...EXTRA_ROUTE_POLICIES,
].sort((a, b) => b.prefix.length - a.prefix.length); // 가장 구체적인 경로가 먼저 매칭되도록

// 경로에 해당하는 정책(가장 구체적인 것)을 찾는다. 정책 없으면 undefined(=로그인만 되면 허용).
function routeAccessFor(pathname: string): Access | undefined {
  return ROUTE_POLICIES.find(
    (p) => pathname === p.prefix || pathname.startsWith(`${p.prefix}/`),
  )?.access;
}

function isRouteAllowed(pathname: string, user: AuthUser | null): boolean {
  return canAccess(routeAccessFor(pathname), user);
}

// 리다이렉트 전에 안내 문구를 읽을 수 있도록 잠깐 대기하는 시간(ms)
const REDIRECT_DELAY_MS = 1200;

// 이번 페이지 로드 세션 동안 앱 내부에서 클라이언트 라우팅이 일어났는지.
// (전체 새로고침 시 모듈이 재초기화되어 false로 시작)
// 외부 사이트에서 곧바로 진입한 경우엔 false → 뒤로가기 대신 홈/로그인으로 보낸다.
let hasInAppHistory = false;

interface ErpLayoutProps {
  title: string;
  children: ReactNode;
  back?: boolean;
}

type SessionSnapshot = {
  hasToken: boolean;
  user: AuthUser | null;
  hydrated: boolean;
};

const SERVER_SESSION: SessionSnapshot = {
  hasToken: false,
  user: null,
  hydrated: false,
};

// "아직 클라이언트에서 읽기 전" 상태를 뜻하는 센티넬.
// null(=로그아웃)과 구분해야, 로그아웃 사용자도 최초 스냅샷에서 hydrated=true가 되어
// 세부 경로 직접 진입 시 빈 화면 대신 로그인 페이지로 리다이렉트된다.
const UNREAD = Symbol("unread");
let cachedToken: string | null | typeof UNREAD = UNREAD;
let cachedUserRaw: string | null | typeof UNREAD = UNREAD;
let cachedSession: SessionSnapshot = SERVER_SESSION;

function getSessionSnapshot(): SessionSnapshot {
  const token = tokenStorage.get();
  const userRaw = typeof window !== "undefined" ? localStorage.getItem("authUser") : null;

  if (token === cachedToken && userRaw === cachedUserRaw) {
    return cachedSession;
  }

  cachedToken = token;
  cachedUserRaw = userRaw;
  cachedSession = {
    hasToken: !!token,
    user: token && userRaw ? (JSON.parse(userRaw) as AuthUser) : null,
    hydrated: true,
  };

  return cachedSession;
}

function getServerSessionSnapshot(): SessionSnapshot {
  return SERVER_SESSION;
}

function subscribeSession(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export default function ErpLayout({ title, children, back = false }: ErpLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [expired, setExpired] = useState(false); // 세션 검증 실패(만료) 여부
  const session = useSyncExternalStore(subscribeSession, getSessionSnapshot, getServerSessionSnapshot);

  // 앱 내부에서 경로가 실제로 "바뀌었을 때"만 기록한다(최초 진입은 제외).
  // → 외부 사이트에서 곧바로 들어온 경우 hasInAppHistory는 계속 false로 유지된다.
  const prevPathRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevPathRef.current !== null && prevPathRef.current !== pathname) {
      hasInAppHistory = true;
    }
    prevPathRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (!session.hydrated) return;

    // 미로그인: 안내 문구를 잠깐 보여준 뒤 로그인 페이지로 이동한다.
    if (!session.hasToken) {
      const id = setTimeout(() => router.replace("/login"), REDIRECT_DELAY_MS);
      return () => clearTimeout(id);
    }

    let active = true;

    employeeApi
      .me()
      .then(() => {
        if (active) setCheckingSession(false);
      })
      .catch(() => {
        // 토큰이 있으나 검증 실패 → 만료로 간주. 안내 후 로그인 페이지로.
        tokenStorage.clear();
        userStorage.clear();
        if (!active) return;
        setExpired(true);
        setCheckingSession(false);
        setTimeout(() => router.replace("/login"), REDIRECT_DELAY_MS);
      });

    return () => {
      active = false;
    };
  }, [router, session.hasToken, session.hydrated]);

  // 권한 없는 페이지에서 벗어날 때: 앱 내부에서 이동해 온 경우에만 뒤로 가고,
  // 외부 사이트에서 곧바로 진입했거나 히스토리가 없으면 홈으로 보낸다.
  const goBackOrHome = useCallback(() => {
    if (hasInAppHistory) {
      router.back();
    } else {
      router.replace("/dashboard");
    }
  }, [router]);

  // 역할·부서 기반 라우트 가드: 로그인은 됐지만 현재 경로 접근 권한이 없으면 이전 페이지로 되돌린다.
  // (메뉴 링크가 숨겨져 있어도 URL 직접 입력으로 진입하는 경우를 차단)
  useEffect(() => {
    if (!session.hydrated || !session.hasToken) return;
    if (!isRouteAllowed(pathname, session.user)) {
      const id = setTimeout(goBackOrHome, REDIRECT_DELAY_MS);
      return () => clearTimeout(id);
    }
  }, [pathname, session.hydrated, session.hasToken, session.user, goBackOrHome]);

  const selectedKey = useMemo(() => {
    if (pathname === "/" || pathname === "/dashboard") return "/dashboard";

    const menuItems = MENU_GROUPS.flatMap((group) => group.items)
      .filter((menu) => menu.href !== "/dashboard")
      .sort((a, b) => b.href.length - a.href.length);

    return menuItems.find((menu) => pathname.startsWith(menu.href))?.href ?? pathname;
  }, [pathname]);

  const handleLogout = async () => {
    if (!confirm("로그아웃하시겠습니까?")) return;

    await authApi.logout().catch(() => {});
    tokenStorage.clear();
    userStorage.clear();
    router.push("/login");
  };

  // 하이드레이션 전(SSR/초기 렌더): 깜빡임 방지로 빈 렌더
  if (!session.hydrated) return null;

  // 세션 만료: 검증 실패 안내 후 로그인으로 이동 중
  if (expired) {
    return (
      <RedirectNotice
        tone="warning"
        title="세션이 만료되었습니다"
        description="보안을 위해 다시 로그인해 주세요. 잠시 후 로그인 페이지로 이동합니다."
        action={
          <Button type="primary" onClick={() => router.replace("/login")}>
            지금 로그인하기
          </Button>
        }
      />
    );
  }

  // 미로그인: 로그인 필요 안내 후 로그인으로 이동 중
  if (!session.hasToken) {
    return (
      <RedirectNotice
        tone="warning"
        title="로그인이 필요합니다"
        description="이 페이지는 로그인 후 이용할 수 있어요. 잠시 후 로그인 페이지로 이동합니다."
        action={
          <Button type="primary" onClick={() => router.replace("/login")}>
            지금 로그인하기
          </Button>
        }
      />
    );
  }

  // 세션 확인 중: me() 검증 대기
  if (checkingSession) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spin size="large" tip="불러오는 중…">
          <div style={{ padding: 24 }} />
        </Spin>
      </div>
    );
  }

  const empName = session.user?.empName ?? "사용자";

  // 접근 권한 없음: 사유 안내 후 이전 페이지로 되돌림
  if (!isRouteAllowed(pathname, session.user)) {
    return (
      <RedirectNotice
        tone="error"
        title="접근 권한이 없습니다"
        description="이 페이지에 접근할 수 있는 권한이 없어요. 잠시 후 이전 페이지로 돌아갑니다."
        action={
          <Button type="primary" onClick={goBackOrHome}>
            이전 페이지로
          </Button>
        }
      />
    );
  }

  return (
    <NotificationProvider>
      <Layout className="erp-shell">
        <Sider width={252} theme="light" className="erp-sidebar">
          <Link href="/dashboard" className="erp-brand" aria-label="약동 ERP 홈">
            <span className="erp-logo-mark">약</span>
            <span>약동 ERP</span>
          </Link>

          <nav className="erp-nav" aria-label="주요 메뉴">
            {MENU_GROUPS.map((group) => {
              const visibleItems = group.items.filter((item) => canAccess(item.access, session.user));

              if (visibleItems.length === 0) return null;

              return (
                <section className="erp-nav-section" key={group.title}>
                  <div className="erp-nav-title">
                    <span>{group.title}</span>
                    <span className="erp-nav-caret">⌃</span>
                  </div>
                  <div className="erp-nav-items">
                    {visibleItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`erp-nav-item${selectedKey === item.href ? " active" : ""}`}
                      >
                        <span className="erp-nav-icon">{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </nav>
        </Sider>

        <Layout>
          <Header className="erp-topbar">
            <div className="erp-title-wrap">
              {back && (
                <Button
                  className="erp-back-btn"
                  icon={<ArrowLeftOutlined />}
                  onClick={() => router.back()}
                  aria-label="뒤로가기"
                />
              )}
              <Title level={3} className="erp-page-title">
                {title}
              </Title>
            </div>

            <Space size={12} className="erp-user-actions">
              <NotificationBell />
              <Link href="/mypage" className="erp-user-link">
                <Avatar icon={<UserOutlined />} />
                <Text>{empName} 님</Text>
              </Link>
              <Button size="small" icon={<LogoutOutlined />} onClick={handleLogout}>
                로그아웃
              </Button>
            </Space>
          </Header>

          <Content className="erp-content">{children}</Content>
        </Layout>
        <NotificationDrawer />
      </Layout>
    </NotificationProvider>
  );
}
