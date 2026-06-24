'use client';

import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { notification } from 'antd';
import { Client, IMessage } from '@stomp/stompjs';
import { alertApi } from '@/lib/api';

import type { NotificationMessage } from '@/lib/api';

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
    const loginId = Number(localStorage.getItem('employeeId'));
    if (!loginId) return;
    try {
      // 실제 API 호출
      await alertApi.markRead(notificationId, loginId);

      setNotifications((prev) =>
        prev.map((item) => (item.notificationId === notificationId ? { ...item, isRead: true } : item)),
      );
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error);
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
        };

        setNotifications((prev) => [newItem, ...prev]);
        notificationApi.warning({
          title: getNotificationTitle(received.level),
          description: received.content,
          placement: 'topRight',
          duration: 15,
        });
      } catch (error) {
        console.error('알림 메시지 파싱 실패:', error);
      }
    },
    [notificationApi],
  );
  useEffect(() => {
    const loginId = Number(localStorage.getItem('employeeId'));
    if (!loginId) return;
    alertApi
      .list(loginId)
      .then((result) => {
        const mapped: NotificationMessage[] = result.map((item) => ({
          notificationId: item.alertId,
          level: item.alertLevel ?? 'INFO',
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
    // const token = localStorage.getItem('accessToken');
    // console.log('[알림] token:', token);
    // if (!token) {
    // console.warn('[알림] 토큰이 없어서 STOMP 연결을 중단합니다.');
    // return;
    // }
    const role = localStorage.getItem('role') ?? '';
    const department = localStorage.getItem('deptCode') ?? '';
    const client = new Client({
      brokerURL: 'ws://localhost:8080/ws-connect',
      // brokerURL: 'ws://192.168.1.190:8080/ws-connect',
      reconnectDelay: 5000,
      // connectHeaders: {
      // Authorization: `Bearer ${token}`,
      // },

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
        console.error('STOMP 오류:', frame);
      },

      onWebSocketError: (error) => {
        console.error('WebSocket 오류:', error);
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
