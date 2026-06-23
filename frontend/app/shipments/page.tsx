'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Button, Card, Flex, Space, Table, Tabs, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import ErpLayout from '@/components/ErpLayout';
import StatusBadge from '@/components/StatusBadge';
import { Shipment, shipmentApi } from '@/lib/api';

const TABS = [
  { key: 'SHIPPED', label: '배송 완료 ' },
  { key: 'CANCELED', label: '배송 취소' },
];

export default function ShipmentListPage() {
  const router = useRouter();

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [tab, setTab] = useState('SHIPPED');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

  useEffect(() => {
    shipmentApi
      .statusCount()
      .then(setCounts)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    shipmentApi
      .listPaging(page, 20, tab)
      .then((res) => {
        setShipments(res.list);
        setTotal(res.total);
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
      });
  }, [page, tab]);

  useEffect(() => {
    // setLoading(true);
    // salesOrderApi
    //   .listPaging(tab, page, 20)
    //   .then((res) => {
    //     setOrders(res.list);
    //     setTotal(res.total);
    //   })
    //   .finally(() => setLoading(false));
  }, [tab, page]);

  const columns = useMemo<ColumnsType<Shipment>>(
    () => [
      {
        title: '주문번호',
        dataIndex: 'soId',
        render: (soId: number) => (
          <Typography.Text strong style={{ color: '#3A7CA5' }}>
            SO-{String(soId).padStart(4, '0')}
          </Typography.Text>
        ),
      },
      {
        title: '배송번호',
        dataIndex: 'shipmentId',
      },
      {
        title: '배송 담당자',
        dataIndex: 'employeeName',
      },
      {
        title: '배송일자',
        dataIndex: 'shipmentDate',
        render: (value?: string) => value?.slice(0, 10) ?? '-',
      },
      {
        title: '상태',
        dataIndex: 'status',
        render: (status: string) => <StatusBadge status={status} />,
      },
      {
        title: '생성일자',
        dataIndex: 'createdAt',
        render: (value?: string) => value?.slice(0, 10) ?? '-',
      },
    ],
    [],
  );

  return (
    <ErpLayout title="출고 관리">
      <Card>
        <Tabs
          activeKey={tab}
          onChange={(key) => {
            setTab(key);
            setPage(1);
          }}
          items={TABS.map((item) => ({
            key: item.key,
            label: (
              <Space size={6}>
                {item.label}
                <Badge
                  count={item.key === '' ? totalCount : (counts[item.key] ?? 0)}
                  showZero
                  color={tab === item.key ? '#69B981' : '#B8C7BA'}
                />
              </Space>
            ),
          }))}
        />

        <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
          <Typography.Text type="secondary">총 {total}건</Typography.Text>
        </Flex>

        <Table
          rowKey="shipmentId"
          loading={loading}
          columns={columns}
          dataSource={shipments}
          pagination={{
            current: page,
            pageSize: 20,
            total,
            showSizeChanger: false,
            onChange: setPage,
          }}
          locale={{ emptyText: '배송 내역이 없습니다.' }}
          onRow={(record) => ({
            className: 'erp-clickable-row',
            onClick: () => {
              router.push(`/shipments/${record.shipmentId}`);
            },
          })}
        />
      </Card>
    </ErpLayout>
  );
}
