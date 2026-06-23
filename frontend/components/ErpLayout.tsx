'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { App, Button, Layout, Menu, Space, Typography } from 'antd';
import {
  BarChartOutlined,
  BellOutlined,
  HomeOutlined,
  MedicineBoxOutlined,
  ShoppingCartOutlined,
  AuditOutlined,
  TruckOutlined,
  UserOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { tokenStorage } from '@/lib/api';
import NotificationBell from '@/components/notification/NotificationBell';
import NotificationDrawer from '@/components/notification/NotificationDrawer';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const MENU_GROUPS = [
  {
    key: 'base',
    label: '기준정보',
    children: [
      { key: '/', label: '홈', icon: <HomeOutlined /> },
      { key: '/attendance', label: '근태 관리', icon: <UserOutlined /> },
      { key: '/customers', label: '거래처 관리', icon: <UserOutlined /> },
      { key: '/products', label: '의약품 관리', icon: <MedicineBoxOutlined /> },
    ],
  },
  {
    key: 'purchase',
    label: '구매 / 입고',
    children: [
      {
        key: '/purchase-orders',
        label: '발주 관리',
        icon: <ShoppingCartOutlined />,
      },
      {
        key: '/receivings',
        label: '입고 관리',
        icon: <TruckOutlined />,
      },
    ],
  },
  {
    key: 'stock',
    label: '재고 / 출고',
    children: [
      { key: '/sales-orders', label: '판매 주문 관리', icon: <AuditOutlined /> },
      { key: '/shipments', label: '출고 관리', icon: <TruckOutlined /> },
      { key: '/stock', label: '재고 관리', icon: <MedicineBoxOutlined /> },
    ],
  },
  {
    key: 'finance',
    label: '정산 / 분석',
    children: [
      { key: '/settlement', label: '정산 / 매출', icon: <WalletOutlined /> },
      { key: '/ai', label: 'AI 분석', icon: <BarChartOutlined /> },
    ],
  },
  {
    key: 'notifications',
    label: '알람',
    children: [{ key: '/notifications', label: '알람 관리', icon: <BellOutlined /> }],
  },
];

function getSelectedKey(pathname: string) {
  const items = MENU_GROUPS.flatMap((group) => group.children);

  const found = items
    .filter((item) => (item.key === '/' ? pathname === '/' : pathname.startsWith(item.key)))
    .sort((a, b) => b.key.length - a.key.length)[0];

  return found?.key ?? '/';
}

export default function ErpLayout({ title, children }: { title: string; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { modal } = App.useApp();

  const [empName, setEmpName] = useState('사용자');
  const [role, setRole] = useState('');

  useEffect(() => {
    setEmpName(localStorage.getItem('empName') ?? '사용자');
    setRole(localStorage.getItem('role') ?? '');
  }, []);

  const selectedKeys = useMemo(() => [getSelectedKey(pathname)], [pathname]);

  const handleLogout = () => {
    modal.confirm({
      title: '로그아웃',
      content: '로그아웃 하시겠습니까?',
      okText: '로그아웃',
      cancelText: '취소',
      onOk: () => {
        tokenStorage.clear();
        localStorage.removeItem('empId');
        localStorage.removeItem('loginId');
        localStorage.removeItem('empName');
        localStorage.removeItem('role');
        localStorage.removeItem('deptId');
        router.push('/login');
      },
    });
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={240}
        style={{
          borderRight: '1px solid #DCE8DF',
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'auto',
          background: '#fff',
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '0 18px',
            fontWeight: 800,
            fontSize: 16,
          }}
        >
          <span className="erp-logo-mark">약</span>
          약통 ERP
        </div>

        <Menu
          mode="inline"
          selectedKeys={selectedKeys}
          defaultOpenKeys={['base', 'purchase', 'stock', 'finance', 'notifications']}
          items={MENU_GROUPS}
          onClick={({ key }) => router.push(String(key))}
          style={{ borderInlineEnd: 'none' }}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            height: 64,
            borderBottom: '1px solid #DCE8DF',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 24px',
            background: '#fff',
          }}
        >
          <Typography.Title level={4} style={{ margin: 0 }}>
            {title}
          </Typography.Title>

          <Space size={12}>
            <NotificationBell />
            <Text type="secondary">
              {empName} 님{role ? ` · ${role}` : ''}
            </Text>
            <Button size="small" onClick={handleLogout}>
              로그아웃
            </Button>
          </Space>
        </Header>

        <Content style={{ padding: 24 }}>
          <Space orientation="vertical" size={16} style={{ width: '100%' }}>
            {children}
          </Space>
        </Content>
        <NotificationDrawer />
      </Layout>
    </Layout>
  );
}
