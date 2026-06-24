"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useSyncExternalStore } from "react";
import { Avatar, Button, Layout, Menu, Space, Typography } from "antd";
import {
  LogoutOutlined,
  MedicineBoxOutlined,
  SafetyCertificateOutlined,
  ShoppingCartOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { authApi, tokenStorage, userStorage, type AuthUser } from "@/lib/api";

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

// roles를 지정하면 해당 역할에게만 노출된다. 미지정이면 전체 노출.
const MENUS = [
  { href: "/", label: "홈", icon: <MedicineBoxOutlined /> },
  { href: "/employees", label: "직원 관리", icon: <UserOutlined /> },
  { href: "/attendance", label: "근태 관리", icon: <UserOutlined /> },
  { href: "/customers", label: "거래처 관리", icon: <UserOutlined /> },
  { href: "/product", label: "상품 관리", icon: <MedicineBoxOutlined /> },
  { href: "/purchase-orders", label: "발주 관리", icon: <ShoppingCartOutlined /> },
  { href: "/purchase-orders/recevings", label: "입고 관리", icon: <ShoppingCartOutlined /> },
  { href: "/recall-drugs", label: "위해의약품", icon: <MedicineBoxOutlined /> },
  { href: "/admin", label: "관리자", icon: <SafetyCertificateOutlined />, roles: ["MANAGER", "ADMIN"] },
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

export default function ErpLayout({ title, children }: ErpLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useSyncExternalStore(
    subscribeSession,
    getSessionSnapshot,
    getServerSessionSnapshot,
  );

  useEffect(() => {
    if (session.hydrated && !session.hasToken) {
      router.replace("/login");
    }
  }, [router, session]);

  const selectedKey = useMemo(() => {
    if (pathname === "/") return "/";

    return (
      MENUS.find((menu) => menu.href !== "/" && pathname.startsWith(menu.href))?.href ??
      pathname
    );
  }, [pathname]);

  const handleLogout = async () => {
    if (!confirm("로그아웃 하시겠습니까?")) return;

    await authApi.logout().catch(() => {});
    tokenStorage.clear();
    userStorage.clear();
    router.push("/login");
  };

  if (!session.hydrated) return null;
  if (!session.hasToken) return null;

  const empName = session.user?.empName ?? "사용자";
  const role = session.user?.role ?? "";

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider width={230} theme="light" style={{ borderRight: "1px solid #f0f0f0" }}>
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "0 20px",
            fontWeight: 700,
            fontSize: 18,
          }}
        >
          <Avatar
            shape="square"
            icon={<MedicineBoxOutlined />}
            style={{ backgroundColor: "#1d9e75" }}
          />
          약통 ERP
        </div>

        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={MENUS.filter((menu) => !menu.roles || menu.roles.includes(role)).map((menu) => ({
            key: menu.href,
            icon: menu.icon,
            label: <Link href={menu.href}>{menu.label}</Link>,
          }))}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            height: 64,
            background: "#fff",
            borderBottom: "1px solid #f0f0f0",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Title level={4} style={{ margin: 0 }}>
            {title}
          </Title>

          <Space size={12}>
            <Avatar icon={<UserOutlined />} />
            <Text>
              {empName} 님{role ? ` · ${role}` : ""}
            </Text>
            <Link href="/mypage">
              <Button size="small" icon={<UserOutlined />}>
                My Page
              </Button>
            </Link>
            <Button size="small" icon={<LogoutOutlined />} onClick={handleLogout}>
              로그아웃
            </Button>
          </Space>
        </Header>

        <Content style={{ padding: 24, background: "#f5f7f9" }}>{children}</Content>
      </Layout>
    </Layout>
  );
}
