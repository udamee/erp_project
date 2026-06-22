'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { Alert, App, Button, Card, DatePicker, Flex, Input, InputNumber, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import ErpLayout from '@/components/ErpLayout';
import { receivingApi, ReceivingDetailInput } from '@/lib/api';

export default function ReceivingProcessPage() {
  const { poId } = useParams<{ poId: string }>();
  const router = useRouter();
  const { message, modal } = App.useApp();

  const [rows, setRows] = useState<ReceivingDetailInput[]>([]);
  const [memo, setMemo] = useState('');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    receivingApi
      .detailsByPoId(Number(poId))
      .then((details) =>
        setRows(
          details.map((d) => ({
            productId: d.productId,
            productName: d.productName,
            orderQty: d.orderQty,
            lotNo: '',
            expiryDate: '',
            receivedQty: d.orderQty,
            unitPrice: d.unitPrice,
          })),
        ),
      )
      .catch((e: Error) => setError(e.message));
  }, [poId]);

  const updateRow = (index: number, field: keyof ReceivingDetailInput, value: string | number) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const isExpired = (date: string) => !!date && dayjs(date).isBefore(dayjs().startOf('day'));

  const hasExpiredRow = rows.some((row) => isExpired(row.expiryDate));

  const submit = async () => {
    for (const row of rows) {
      if (!row.lotNo.trim()) {
        message.warning(`${row.productName}: 로트번호를 입력해주세요.`);
        return;
      }

      if (!row.expiryDate) {
        message.warning(`${row.productName}: 유효기간을 입력해주세요.`);
        return;
      }

      if (isExpired(row.expiryDate)) {
        message.warning(`${row.productName}: 유효기간이 만료된 날짜입니다.`);
        return;
      }

      if (!row.receivedQty || row.receivedQty < 1) {
        message.warning(`${row.productName}: 입고 수량을 확인해주세요.`);
        return;
      }
    }

    modal.confirm({
      title: '입고 처리',
      content: '입고 처리하시겠습니까? 처리 후 재고 로트가 자동 생성됩니다.',
      okText: '입고 처리',
      cancelText: '취소',
      onOk: async () => {
        setProcessing(true);

        try {
          await receivingApi.process({
            poId: Number(poId),
            memo: memo || undefined,
            details: rows.map(({ productName, orderQty, ...rest }) => rest),
          });

          message.success('입고 처리가 완료되었습니다.');
          router.push('/receivings');
        } catch (e) {
          message.error((e as Error).message);
        } finally {
          setProcessing(false);
        }
      },
    });
  };

  const columns = useMemo<ColumnsType<ReceivingDetailInput>>(
    () => [
      {
        title: '제품명',
        dataIndex: 'productName',
      },
      {
        title: '발주수량',
        dataIndex: 'orderQty',
        align: 'right',
      },
      {
        title: '로트번호',
        width: 180,
        render: (_, row, index) => (
          <Input
            placeholder="LOT-2606-A01"
            value={row.lotNo}
            onChange={(e) => updateRow(index, 'lotNo', e.target.value)}
          />
        ),
      },
      {
        title: '유효기간',
        width: 180,
        render: (_, row, index) => (
          <DatePicker
            style={{ width: '100%' }}
            value={row.expiryDate ? dayjs(row.expiryDate) : null}
            status={isExpired(row.expiryDate) ? 'error' : undefined}
            disabledDate={(current) => !!current && current.isBefore(dayjs().startOf('day'))}
            onChange={(date) => updateRow(index, 'expiryDate', date ? date.format('YYYY-MM-DD') : '')}
          />
        ),
      },
      {
        title: '입고수량',
        width: 130,
        render: (_, row, index) => (
          <InputNumber
            min={1}
            value={row.receivedQty}
            style={{ width: '100%' }}
            onChange={(value) => updateRow(index, 'receivedQty', value ?? 1)}
          />
        ),
      },
    ],
    [],
  );

  return (
    <ErpLayout title={`입고 처리 — PO-${String(poId).padStart(4, '0')}`}>
      <Button style={{ alignSelf: 'flex-start' }} onClick={() => router.back()}>
        입고 가능 목록으로
      </Button>

      {error && <Alert type="error" showIcon message={error} />}

      <Card title="입고 품목">
        <Table
          rowKey={(row) => String(row.productId)}
          columns={columns}
          dataSource={rows}
          pagination={false}
          locale={{ emptyText: '입고 처리할 품목이 없습니다.' }}
        />
      </Card>

      {hasExpiredRow && (
        <Alert
          type="warning"
          showIcon
          message="유효기간이 이미 만료된 품목이 있습니다."
          description="날짜를 확인한 뒤 다시 입력해주세요."
        />
      )}

      <Card title="메모">
        <Input placeholder="입고 관련 메모를 입력하세요" value={memo} onChange={(e) => setMemo(e.target.value)} />
      </Card>

      <Flex justify="flex-end" gap={8}>
        <Button onClick={() => router.back()}>취소</Button>
        <Button type="primary" loading={processing} disabled={rows.length === 0} onClick={submit}>
          입고 처리 완료
        </Button>
      </Flex>
    </ErpLayout>
  );
}
