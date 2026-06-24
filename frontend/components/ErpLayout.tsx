"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Avatar, Button, Layout, Space, Typography } from "antd";
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
import { NotificationProvider } from "@/app/providers/NotificationProvider";

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

type MenuItem = {
  href: string;
  label: string;
  icon: ReactNode;
  roles?: string[];
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
      { href: "/purchase-orders", label: "발주 관리", icon: <ShoppingCartOutlined /> },
      { href: "/purchase-orders/recevings", label: "입고 관리", icon: <TruckOutlined /> },
    ],
  },
  {
    title: "재고 / 출고",
    items: [
      { href: "/sales-orders", label: "판매 주문 관리", icon: <ReconciliationOutlined /> },
      { href: "/shipments", label: "출고 관리", icon: <TruckOutlined /> },
      { href: "/stock", label: "재고 관리", icon: <MedicineBoxOutlined /> },
    ],
  },
  {
    title: "정산 / 분석",
    items: [
      { href: "/settlement/dashboard", label: "정산 / 매출", icon: <WalletOutlined /> },
      { href: "/settlement/receivables", label: "미수금 관리", icon: <WalletOutlined /> },
      { href: "/settlement/payables", label: "미지급금 관리", icon: <WalletOutlined /> },
    ],
  },
  {
    title: "알림",
    items: [
      { href: "/admin", label: "관리자", icon: <SafetyCertificateOutlined />, roles: ["MANAGER", "ADMIN"] },
    ],
  },
];

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

let cachedToken: string | null = null;
let cachedUserRaw: string | null = null;
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
  const session = useSyncExternalStore(
    subscribeSession,
    getSessionSnapshot,
    getServerSessionSnapshot,
  );

  useEffect(() => {
    if (!session.hydrated) return;

    if (!session.hasToken) {
      router.replace("/login");
      return;
    }

    let active = true;

    employeeApi.me()
      .then(() => {
        if (active) setCheckingSession(false);
      })
      .catch(() => {
        tokenStorage.clear();
        userStorage.clear();
        if (active) setCheckingSession(false);
        router.replace("/login");
      });

    return () => {
      active = false;
    };
  }, [router, session.hasToken, session.hydrated]);

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

  if (!session.hydrated || checkingSession) return null;
  if (!session.hasToken) return null;

  const empName = session.user?.empName ?? "사용자";
  const role = session.user?.role ?? "";

  return (
    <NotificationProvider>
      <Layout className="erp-shell">
        <Sider width={252} theme="light" className="erp-sidebar">
          <Link href="/dashboard" className="erp-brand" aria-label="약통 ERP 홈">
            <span className="erp-logo-mark">약</span>
            <span>약통 ERP</span>
          </Link>

          <nav className="erp-nav" aria-label="주요 메뉴">
            {MENU_GROUPS.map((group) => {
              const visibleItems = group.items.filter((item) => !item.roles || item.roles.includes(role));

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
