'use client';

import { useContext } from 'react';
import { BellOutlined } from '@ant-design/icons';
import { Badge, Button, Tooltip } from 'antd';

import { NotificationContext } from '../../app/providers/NotificationProvider';

export default function NotificationBell() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error('NotificationBell은 NotificationProvider 내부에서 사용해야 합니다.');
  }

  const { unreadCount, openDrawer } = context;

  return (
    <Tooltip title="알림">
      <Badge count={unreadCount} size="small" overflowCount={99}>
        <Button type="text" shape="circle" icon={<BellOutlined />} onClick={openDrawer} aria-label="알림 열기" />
      </Badge>
    </Tooltip>
  );
}
