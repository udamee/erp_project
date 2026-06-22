'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, App, Button, Card, Form, Input, Typography } from 'antd';
import { api, tokenStorage } from '@/lib/api';

const { Text } = Typography;

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  empId: number;
  loginId: string;
  empName: string;
  role: string;
  deptId: number;
}

export default function LoginPage() {
  const router = useRouter();
  const { message } = App.useApp();

  const [error, setError] = useState('');

  const handleLogin = async (values: { loginId: string; password: string }) => {
    setError('');

    try {
      const data = await api.post<LoginResponse>('/api/auth/login', {
        loginId: values.loginId,
        password: values.password,
      });

      tokenStorage.set(data.accessToken);
      localStorage.setItem('empId', String(data.empId));
      localStorage.setItem('loginId', data.loginId);
      localStorage.setItem('empName', data.empName);
      localStorage.setItem('role', data.role);
      localStorage.setItem('deptId', String(data.deptId));

      message.success('로그인되었습니다.');
      router.push('/purchase-orders');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #F4FBF6 0%, #E5F6EA 55%, #D7F0DF 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <Card
        style={{
          width: 390,
          borderRadius: 18,
          boxShadow: '0 16px 40px rgba(40, 107, 63, 0.12)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <span className="erp-logo-mark" style={{ width: 48, height: 48, fontSize: 20 }}>
            약
          </span>

          <Typography.Title level={3} style={{ margin: '12px 0 4px' }}>
            약통 ERP
          </Typography.Title>

          <Text type="secondary">의약품 유통 관리 시스템</Text>
        </div>

        <Form layout="vertical" onFinish={handleLogin} requiredMark={false}>
          <Form.Item label="아이디" name="loginId" rules={[{ required: true, message: '아이디를 입력해주세요.' }]}>
            <Input placeholder="아이디를 입력하세요" autoComplete="username" />
          </Form.Item>

          <Form.Item label="비밀번호" name="password" rules={[{ required: true, message: '비밀번호를 입력해주세요.' }]}>
            <Input.Password placeholder="비밀번호를 입력하세요" autoComplete="current-password" />
          </Form.Item>

          {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}

          <Button type="primary" htmlType="submit" block>
            로그인
          </Button>
        </Form>
      </Card>
    </div>
  );
}
