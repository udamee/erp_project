'use client';

import { App, ConfigProvider, theme } from 'antd';
import koKR from 'antd/locale/ko_KR';

export default function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      locale={koKR}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#69B981',
          colorSuccess: '#52C41A',
          colorWarning: '#D89614',
          colorError: '#D94A4A',
          colorInfo: '#3A7CA5',

          colorBgLayout: '#F4FBF6',
          colorBgContainer: '#FFFFFF',
          colorBorder: '#DCE8DF',

          colorText: '#1F2937',
          colorTextSecondary: '#6B7280',

          borderRadius: 10,
          fontSize: 13,
          controlHeight: 36,
        },
        components: {
          Layout: {
            siderBg: '#FFFFFF',
            headerBg: '#FFFFFF',
            bodyBg: '#F4FBF6',
          },
          Menu: {
            itemSelectedBg: '#E3F5E8',
            itemSelectedColor: '#286B3F',
            itemHoverBg: '#F0FAF3',
            itemBorderRadius: 8,
          },
          Button: {
            primaryShadow: 'none',
            borderRadius: 8,
          },
          Table: {
            headerBg: '#F2FAF4',
            headerColor: '#5D6F63',
            rowHoverBg: '#F8FCF9',
            borderColor: '#DCE8DF',
          },
          Card: {
            borderRadiusLG: 12,
          },
          Modal: {
            borderRadiusLG: 12,
          },
        },
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  );
}
