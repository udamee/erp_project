'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { App, Button, Card, Descriptions, Flex, Input, Space, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import ErpLayout from '@/components/ErpLayout';
import StatusBadge from '@/components/StatusBadge';
import { purchaseOrderApi, PurchaseOrder } from '@/lib/api';

const { Text } = Typography;

export default function PurchaseOrderDetailPage() {
  const { poId } = useParams<{ poId: string }>();
  const router = useRouter();
  const { message, modal } = App.useApp();

  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [error, setError] = useState('');
  const [role, setRole] = useState('');
  const [processing, setProcessing] = useState(false);

  const load = useCallback(() => {
    purchaseOrderApi
      .detail(Number(poId))
      .then(setOrder)
      .catch((e: Error) => setError(e.message));
  }, [poId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setRole(localStorage.getItem('role') ?? '');
  }, []);

  const canApprove = order?.status === 'REQUESTED' && (role === 'MANAGER' || role === 'ADMIN');

  const handleApprove = () => {
    modal.confirm({
      title: '발주 승인',
      content: '이 발주를 승인하시겠습니까?',
      okText: '승인',
      cancelText: '취소',
      onOk: async () => {
        setProcessing(true);

        try {
          await purchaseOrderApi.approve(Number(poId));
          message.success('발주가 승인되었습니다.');
          router.push('/purchase-orders');
        } catch (e) {
          message.error((e as Error).message);
        } finally {
          setProcessing(false);
        }
      },
    });
  };

  const handleReject = () => {
    let reason = '';

    modal.confirm({
      title: '발주 반려',
      width: 520,
      okText: '반려 확정',
      cancelText: '취소',
      okButtonProps: { danger: true },
      content: (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text type="secondary">
            PO-{String(order?.poId).padStart(4, '0')} 발주를 반려합니다. 반려 사유는 기안자에게 전달됩니다.
          </Text>
          <Input.TextArea
            rows={4}
            placeholder="반려 사유를 입력해주세요"
            onChange={(e) => {
              reason = e.target.value;
            }}
          />
        </Space>
      ),
      onOk: async () => {
        if (!reason.trim()) {
          message.warning('반려 사유를 입력해주세요.');
          return Promise.reject();
        }

        setProcessing(true);

        try {
          await purchaseOrderApi.reject(Number(poId), reason.trim());
          message.success('발주가 반려되었습니다.');
          router.push('/purchase-orders');
        } catch (e) {
          message.error((e as Error).message);
        } finally {
          setProcessing(false);
        }
      },
    });
  };

  const columns = useMemo<ColumnsType<any>>(
    () => [
      { title: '제품코드', dataIndex: 'productCode' },
      { title: '제품명', dataIndex: 'productName' },
      {
        title: '수량',
        dataIndex: 'orderQty',
        align: 'right',
        render: (value?: number) => value?.toLocaleString() ?? 0,
      },
      {
        title: '단가',
        dataIndex: 'unitPrice',
        align: 'right',
        render: (value?: number) => value?.toLocaleString() ?? 0,
      },
      {
        title: '금액',
        dataIndex: 'amount',
        align: 'right',
        render: (value?: number) => `${value?.toLocaleString() ?? 0}원`,
      },
    ],
    [],
  );

  if (error) {
    return (
      <ErpLayout title="발주 상세">
        <Card>
          <Text type="danger">{error}</Text>
        </Card>
      </ErpLayout>
    );
  }

  if (!order) {
    return (
      <ErpLayout title="발주 상세">
        <Card loading />
      </ErpLayout>
    );
  }

  return (
    <ErpLayout title={`발주 상세 — PO-${String(order.poId).padStart(4, '0')}`}>
      <Flex justify="space-between" align="center">
        <Button onClick={() => router.back()}>목록으로</Button>
        <StatusBadge status={order.status} />
      </Flex>

      <Card>
        <Descriptions bordered column={3} size="small">
          <Descriptions.Item label="공급처">
            {order.supplierName}
            {order.supplierPhone && <Text type="secondary"> · {order.supplierPhone}</Text>}
          </Descriptions.Item>

          <Descriptions.Item label="기안자">{order.requestEmpName}</Descriptions.Item>

          <Descriptions.Item label="발주일">{order.poDate?.slice(0, 10)}</Descriptions.Item>

          <Descriptions.Item label="총금액">
            <Text strong>{order.totalAmount?.toLocaleString()}원</Text>
          </Descriptions.Item>

          <Descriptions.Item label="승인자">{order.approveEmpName ?? '-'}</Descriptions.Item>

          <Descriptions.Item label="상태">
            <StatusBadge status={order.status} />
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="발주 품목">
        <Table
          rowKey="poDetailId"
          columns={columns}
          dataSource={order.details ?? []}
          pagination={false}
          locale={{ emptyText: '발주 품목이 없습니다.' }}
        />
      </Card>

      {order.memo && (
        <Card>
          <Text type="secondary">메모</Text>
          <div style={{ marginTop: 6 }}>{order.memo}</div>
        </Card>
      )}

      {canApprove && (
        <div className="erp-page-actions">
          <Button danger disabled={processing} onClick={handleReject}>
            반려
          </Button>
          <Button type="primary" loading={processing} onClick={handleApprove}>
            승인
          </Button>
        </div>
      )}
    </ErpLayout>
  );
}
