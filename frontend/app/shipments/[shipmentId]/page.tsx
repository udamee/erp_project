'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Card, Descriptions, Flex, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import ErpLayout from '@/components/ErpLayout';
import StatusBadge from '@/components/StatusBadge';
import { ShipmentDetail, shipmentApi } from '@/lib/api';

const { Text } = Typography;

export default function ShipmentDetailPage() {
  const { shipmentId } = useParams<{ shipmentId: string }>();
  const router = useRouter();
  const [shipment, setShipment] = useState<ShipmentDetail[]>([]);
  const [error, setError] = useState('');

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

  const columns = useMemo<ColumnsType<ShipmentDetail>>(
    () => [
      { title: '제품명', dataIndex: 'productName' },
      { title: '로트번호', dataIndex: 'lotNo' },
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
      <ErpLayout title="출고 상세">
        <Card>
          <Text type="danger">{error}</Text>
        </Card>
      </ErpLayout>
    );
  }

  if (!shipment.length) {
    return (
      <ErpLayout title="출고 상세">
        <Card loading />
      </ErpLayout>
    );
  }

  const shipmentHeader = shipment[0];

  return (
    <ErpLayout title={`출고 상세 SH-${String(shipmentHeader.shipmentId).padStart(4, '0')}`}>
      <Flex justify="space-between" align="center">
        <Button onClick={() => router.back()}>목록으로</Button>
      </Flex>

      <Card>
        <Descriptions bordered column={3} size="small">
          <Descriptions.Item label="고객사">{shipmentHeader.customerName}</Descriptions.Item>
          <Descriptions.Item label="주문일">{shipmentHeader.orderDate?.slice(0, 10) ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="상태">
            <StatusBadge status={shipmentHeader.status} />
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="출고 품목">
        <Table
          rowKey="shipmentDetailId"
          columns={columns}
          dataSource={shipment}
          pagination={false}
          locale={{ emptyText: '출고 품목이 없습니다.' }}
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
