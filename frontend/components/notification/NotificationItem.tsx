'use client';

import { Button, Flex, Tag, Typography } from 'antd';

import type { NotificationMessage } from '@/lib/api';

interface NotificationItemProps {
  item: NotificationMessage;
  onRead: (notificationId: number) => void;
}

export default function NotificationItem({ item, onRead }: NotificationItemProps) {
  return (
    <div
      style={{
        padding: 14,
        borderBottom: '1px solid #edf0ee',
        background: item.isRead ? '#fff' : '#f3fbf7',
      }}
    >
      <Flex vertical gap={8}>
        <Flex justify="space-between" align="center">
          <Tag color={getTagColor(item.level)}>{getAlertLabel(item.level)}</Tag>

          {!item.isRead && (
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#1d9e75',
              }}
            />
          )}
        </Flex>

        <div>{item.content}</div>

        <Flex justify="space-between" align="center">
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {new Date(item.dateTime).toLocaleString('ko-KR')}
          </Typography.Text>

          <Button type="link" disabled={item.isRead} size="small" onClick={() => onRead(item.notificationId)}>
            {item.isRead ? '읽음' : '읽음 처리'}
          </Button>
        </Flex>
      </Flex>
    </div>
  );
}

function getTagColor(level?: string) {
  switch (level) {
    case 'CRITICAL':
      return 'red';

    case 'WARNING':
      return 'orange';

    default:
      return 'blue';
  }
}

function getAlertLabel(alertType?: string) {
  switch (alertType) {
    case 'SAFETY_STOCK_LOW':
      return '재고 부족';

    case 'EXPIRED':
      return '유효기간 만료';

    case 'EXPIRY_10':
      return '10일 이내';

    case 'EXPIRY_30':
      return '30일 이내';

    case 'EXPIRY_90':
      return '90일 이내';

    default:
      return '알림';
  }
}
