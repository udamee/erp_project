'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Button, Card, Flex, Space, Table, Tabs, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import ErpLayout from '@/components/ErpLayout';
import StatusBadge from '@/components/StatusBadge';
import { purchaseOrderApi, PurchaseOrder } from '@/lib/api';

const TABS = [
  { key: '', label: '전체' },
  { key: 'REQUESTED', label: '승인 대기' },
  { key: 'APPROVED', label: '승인 완료' },
  { key: 'REJECTED', label: '반려' },
  { key: 'COMPLETED', label: '입고 완료' },
];

export default function PurchaseOrderListPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [tab, setTab] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

  useEffect(() => {
    purchaseOrderApi
      .statusCounts()
      .then(setCounts)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);

    purchaseOrderApi
      .listPaging(tab, page, 10)
      .then((res) => {
        setOrders(res.list);
        setTotal(res.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tab, page]);

  const columns = useMemo<ColumnsType<PurchaseOrder>>(
    () => [
      {
        title: '발주번호',
        dataIndex: 'poId',
        render: (poId: number) => (
          <Typography.Text strong style={{ color: '#3A7CA5' }}>
            PO-{String(poId).padStart(4, '0')}
          </Typography.Text>
        ),
      },
      {
        title: '공급처',
        dataIndex: 'supplierName',
      },
      {
        title: '기안자',
        dataIndex: 'requestEmpName',
      },
      {
        title: '발주일',
        dataIndex: 'poDate',
        render: (value?: string) => value?.slice(0, 10) ?? '-',
      },
      {
        title: '상태',
        dataIndex: 'status',
        render: (status: string) => <StatusBadge status={status} />,
      },
      {
        title: '총금액',
        dataIndex: 'totalAmount',
        align: 'right',
        render: (value?: number) => `${value?.toLocaleString() ?? 0}원`,
      },
    ],
    [],
  );

  return (
    <ErpLayout title="발주 관리">
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

          <Button type="primary" onClick={() => router.push('/purchase-orders/new')}>
            발주 등록
          </Button>
        </Flex>

        <Table
          rowKey="poId"
          loading={loading}
          columns={columns}
          dataSource={orders}
          pagination={{
            current: page,
            pageSize: 10,
            total,
            showSizeChanger: false,
            onChange: setPage,
          }}
          locale={{ emptyText: '발주 내역이 없습니다.' }}
          onRow={(record) => ({
            className: 'erp-clickable-row',
            onClick: () => router.push(`/purchase-orders/${record.poId}`),
          })}
        />
      </Card>
    </ErpLayout>
  );
}
