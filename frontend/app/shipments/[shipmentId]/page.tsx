'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { App, Button, Card, Descriptions, Flex, Input, Space, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import ErpLayout from '@/components/ErpLayout';
import StatusBadge from '@/components/StatusBadge';
import { purchaseOrderApi, ShipmentDetail, shipmentApi } from '@/lib/api';

const { Text } = Typography;

export default function ShipmentDetailPage() {
  const { shipmentId } = useParams<{ shipmentId: string }>();
  const router = useRouter();
  const { message, modal } = App.useApp();

  const [shipment, setShipment] = useState<ShipmentDetail[]>([]);
  const [error, setError] = useState('');
  const [role, setRole] = useState('');
  const [processing, setProcessing] = useState(false);
  const [salesOrderId, setSalesOrderId] = useState('');

  const load = useCallback(() => {
    shipmentApi
      .detail(Number(shipmentId))
      .then((res) => {
        setShipment(res);
      })
      .catch((e: Error) => {
        setError(e.message);
      });
  }, [shipmentId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setRole(localStorage.getItem('role') ?? '');
  }, []);

  const handleReject = () => {
    let reason = '';

    modal.confirm({
      title: '판매 주문 반려',
      width: 520,
      okText: '판매 주문 확정',
      cancelText: '취소',
      okButtonProps: { danger: true },
      content: (
        <Space orientation="vertical" style={{ width: '100%' }}>
          <Text type="secondary">
            Shipment-{String(shipment[0]?.shipmentId).padStart(4, '0')} 배송요청을 반려합니다. 반려 사유는 기안자에게
            전달됩니다.
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
          await purchaseOrderApi.reject(Number(shipmentId), reason.trim());
          message.success('배송 요청이 반려되었습니다.');
          router.push('/sales-orders');
        } catch (e) {
          message.error((e as Error).message);
        } finally {
          setProcessing(false);
        }
      },
    });
  };

  const columns = useMemo<ColumnsType<ShipmentDetail>>(
    () => [
      { title: '배송번호', dataIndex: 'shipmentId' },
      { title: '제품명', dataIndex: 'productName' },
      {
        title: '로트번호',
        dataIndex: 'lotNo',
      },
      {
        title: '유효기간',
        dataIndex: 'expiryDate',
        render: (value?: string) => value?.slice(0, 10) ?? '-',
      },
      {
        title: '출고수량',
        dataIndex: 'shippedQty',
        align: 'right',
        render: (value?: number) => value?.toLocaleString() ?? 0,
      },
    ],
    [],
  );

  if (error) {
    return (
      <ErpLayout title="배송 관리 상세">
        <Card>
          <Text type="danger">{error}</Text>
        </Card>
      </ErpLayout>
    );
  }

  if (!shipment.length) {
    return (
      <ErpLayout title="배송 관리 상세">
        <Card loading />
      </ErpLayout>
    );
  }

  const shipmentHeader = shipment[0];

  return (
    <ErpLayout title={`배송 상세 — SH-${String(shipmentHeader.shipmentId).padStart(4, '0')}`}>
      <Flex justify="space-between" align="center">
        <Button onClick={() => router.back()}>목록으로</Button>
      </Flex>

      <Card>
        <Descriptions bordered column={3} size="small">
          <Descriptions.Item label="고객사">{shipmentHeader.customerName}</Descriptions.Item>
          <Descriptions.Item label="주문일">{shipmentHeader.orderDate.slice(0, 10)}</Descriptions.Item>
          <Descriptions.Item label="상태">
            <StatusBadge status={shipmentHeader.status} />
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="주문 품목">
        <Table
          rowKey="shipmentDetailId"
          columns={columns}
          dataSource={shipment ?? []}
          pagination={false}
          locale={{ emptyText: '주문 품목이 없습니다.' }}
        />
      </Card>

      {shipmentHeader.memo && (
        <Card>
          <Text type="secondary">메모</Text>
          <div style={{ marginTop: 6 }}>{shipmentHeader.memo}</div>
        </Card>
      )}
    </ErpLayout>
  );
}
