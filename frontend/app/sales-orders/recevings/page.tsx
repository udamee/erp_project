'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Card, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import ErpLayout from '@/components/ErpLayout';
import { receivingApi } from '@/lib/api';

interface ReceivableOrder {
  poId: number;
  supplierName: string;
  requestEmpName: string;
  approveEmpName: string;
  approveDate: string;
  totalAmount: number;
}

export default function ReceivableListPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<ReceivableOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    receivingApi
      .receivableList()
      .then((data) => setOrders(data as unknown as ReceivableOrder[]))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const columns = useMemo<ColumnsType<ReceivableOrder>>(
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
      { title: '공급처', dataIndex: 'supplierName' },
      { title: '기안자', dataIndex: 'requestEmpName' },
      { title: '승인자', dataIndex: 'approveEmpName' },
      {
        title: '승인일',
        dataIndex: 'approveDate',
        render: (value?: string) => value?.slice(0, 10) ?? '-',
      },
      {
        title: '총금액',
        dataIndex: 'totalAmount',
        align: 'right',
        render: (value?: number) => `${value?.toLocaleString() ?? 0}원`,
      },
      {
        title: '',
        width: 110,
        align: 'center',
        render: (_, record) => (
          <Button type="primary" size="small" onClick={() => router.push(`/receivings/${record.poId}`)}>
            입고하기
          </Button>
        ),
      },
    ],
    [router],
  );

  return (
    <ErpLayout title="입고 관리">
      <Alert
        type="info"
        showIcon
        message="승인 완료된 발주 목록입니다."
        description="물품 도착 후 입고하기를 눌러 로트번호, 유효기간, 입고수량을 입력하세요."
      />

      {error && <Alert type="error" showIcon message={error} />}

      <Card>
        <Table
          rowKey="poId"
          loading={loading}
          columns={columns}
          dataSource={orders}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          locale={{ emptyText: '입고 가능한 발주가 없습니다.' }}
        />
      </Card>
    </ErpLayout>
  );
}
