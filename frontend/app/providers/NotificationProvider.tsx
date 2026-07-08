'use client';

import { createContext, useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { notification } from 'antd';
import { Client, IMessage } from '@stomp/stompjs';
import { alertApi, type NotificationMessage } from '@/lib/api';
import { userStorage } from '@/lib/api-client';

interface NotificationContextValue {
  notifications: NotificationMessage[];
  unreadCount: number;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  markAsRead: (notificationId: number) => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notificationApi, contextHolder] = notification.useNotification();
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  const receivedIdsRef = useRef<Set<number>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);

  const unreadCount = useMemo(() => notifications.filter((item) => !item.isRead).length, [notifications]);

  const openDrawer = useCallback(() => {
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      await alertApi.markRead(notificationId);
      setNotifications((prev) =>
        prev.map((item) => (item.notificationId === notificationId ? { ...item, isRead: true } : item)),
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  const handleMessage = useCallback(
    (message: IMessage) => {
      try {
        const received = JSON.parse(message.body) as NotificationMessage;
        if (receivedIdsRef.current.has(received.notificationId)) {
          return;
        }
        receivedIdsRef.current.add(received.notificationId);
        const newItem: NotificationMessage = {
          notificationId: received.notificationId,
          level: received.level,
          receiver: received.receiver,
          content: received.content,
          dateTime: received.dateTime,
          isRead: false,
          alertType: received.alertType,
        };

        setNotifications((prev) => {
          const duplicated = prev.some((item) => item.notificationId === newItem.notificationId);
          return duplicated ? prev : [newItem, ...prev];
        });

        notificationApi.warning({
          message: getNotificationTitle(received.level),
          description: received.content,
          placement: 'topRight',
          duration: 15,
        });
      } catch (error) {
        console.error('Failed to parse notification message:', error);
      }
    },
    [notificationApi],
  );
  useEffect(() => {
    const loginId = Number(localStorage.getItem('empId'));
    if (!loginId) return;
    alertApi
      .list()
      .then((result) => {
        const mapped: NotificationMessage[] = result.map((item) => ({
          notificationId: item.alertId,
          level: item.alertLevel ?? 'INFO',
          alertType: item.alertType,
          receiver: item.deptCode ?? '',
          content: item.message,
          dateTime: item.createdAt,
          isRead: item.isRead === 'Y',
        }));
        setNotifications(mapped);
        receivedIdsRef.current = new Set(mapped.map((item) => item.notificationId));
      })
      .catch((error) => {
        console.error('기존 알림 조회 실패: ', error);
      });
  }, []);

  useEffect(() => {
    const user = userStorage.get();
    const role = user?.role ?? '';
    const department = user?.deptCode ?? '';

    // WS 주소: NEXT_PUBLIC_API_URL이 있으면 그걸(http→ws), 없으면(상대경로 배포)
    // 현재 접속한 호스트 기준으로 same-origin 연결 (Ingress가 /ws-connect를 백엔드로 라우팅).
    const apiBase = process.env.NEXT_PUBLIC_API_URL;
    const wsUrl = apiBase
      ? apiBase.replace(/^http/, 'ws') + '/ws-connect'
      : `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws-connect`;

    const client = new Client({
      brokerURL: wsUrl,
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe('/topic/notifications', handleMessage);
        if (department) {
          client.subscribe(`/topic/departments/${department}/notifications`, handleMessage);
        }
        if (department && role) {
          client.subscribe(`/topic/departments/${department}/roles/${role}/notifications`, handleMessage);
        }
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
      },
      onWebSocketError: (error) => {
        console.error('WebSocket error:', error);
      },
      onWebSocketClose: (event) => {
        console.error('소켓종료', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });
      },
    });

    client.activate();

    return () => {
      void client.deactivate();
    };
  }, [handleMessage]);

  const contextValue = useMemo(
    () => ({
      notifications,
      unreadCount,
      drawerOpen,
      openDrawer,
      closeDrawer,
      markAsRead,
    }),
    [notifications, unreadCount, drawerOpen, openDrawer, closeDrawer, markAsRead],
  );

  return (
    <NotificationContext.Provider value={contextValue}>
      {contextHolder}
      {children}
    </NotificationContext.Provider>
  );
}

function getNotificationTitle(level: string) {
  switch (level) {
    case 'CRITICAL':
      return '심각';
    case 'WARNING':
      return '주의';
    case 'INFO':
      return '안내';
    default:
      return '새로운 알림';
  }
}
