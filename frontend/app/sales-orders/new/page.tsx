'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  App,
  Button,
  Card,
  Checkbox,
  Flex,
  Form,
  Input,
  InputNumber,
  List,
  Modal,
  Select,
  Space,
  Table,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import ErpLayout from '@/components/ErpLayout';
import { salesOrderApi, purchaseOrderApi } from '@/lib/api';

interface Customer {
  customerId: number;
  customerName: string;
}

interface Product {
  productId: number;
  productCode: string;
  productName: string;
  unit: string;
  standardSalesPrice: number;
}

interface OrderRow {
  productId: number;
  orderQty: number;
  unitPrice: number;
}

export default function SalesOrderCreatePage() {
  const router = useRouter();
  const { message } = App.useApp();

  const [products, setProducts] = useState<Product[]>([]);
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState<number>();
  const [memo, setMemo] = useState('');
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [processing, setProcessing] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [checked, setChecked] = useState<Set<number>>(new Set());

  useEffect(() => {
  salesOrderApi
    .customers()
    .then(setCustomers)
    .catch((e) => message.error(e.message));
  }, [message]);

  useEffect(() => {
    if (!keyword.trim()) {
      setProductResults([]);
      return;
    }
    const timer = setTimeout(() => {
      purchaseOrderApi
        .searchProducts(keyword)
        .then((data) => setProductResults(data as unknown as Product[]))
        .catch((e) => message.error(e.message));
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword, message]);

  const selectedIds = useMemo(() => new Set(rows.map((row) => row.productId)), [rows]);
  const productMap = useMemo(() => new Map(products.map((product) => [product.productId, product])), [products]);
  const filteredProducts = useMemo(() => {
  return productResults.filter((product) => !selectedIds.has(product.productId));
}, [productResults, selectedIds]);

  const totalAmount = rows.reduce((sum, row) => sum + row.orderQty * row.unitPrice, 0);

  const updateRow = (productId: number, field: 'orderQty' | 'unitPrice', value: number) => {
    setRows((prev) => prev.map((row) => (row.productId === productId ? { ...row, [field]: value } : row)));
  };

  const removeRow = (productId: number) => {
    setRows((prev) => prev.filter((row) => row.productId !== productId));
  };

  const openPicker = () => {
    setChecked(new Set());
    setKeyword('');
    setPickerOpen(true);
  };

  const toggleCheck = (productId: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const addChecked = () => {
    if (checked.size === 0) {
      message.warning('추가할 의약품을 선택해주세요.');
      return;
    }

    const newRows: OrderRow[] = products
      .filter((product) => checked.has(product.productId))
      .map((product) => ({
        productId: product.productId,
        orderQty: 1,
        unitPrice: product.standardSalesPrice,
      }));

    setRows((prev) => [...prev, ...newRows]);
    setPickerOpen(false);
  };

  const handleSubmit = async () => {
    if (!customerId) {
      message.warning('거래처를 선택해주세요.');
      return;
    }

    if (rows.length === 0) {
      message.warning('주문할 의약품을 1개 이상 추가해주세요.');
      return;
    }

    for (const row of rows) {
      if (row.orderQty < 1) {
        message.warning('수량은 1 이상이어야 합니다.');
        return;
      }
    }

    setProcessing(true);

    try {
      await salesOrderApi.create({
        customerId,
        memo: memo || undefined,
        details: rows.map((row) => ({
          productId: row.productId,
          orderQty: row.orderQty,
        })),
      });

      message.success('판매 주문이 등록되었습니다.');
      router.push('/sales-orders');
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  const columns: ColumnsType<OrderRow> = [
    {
      title: '의약품',
      dataIndex: 'productId',
      render: (productId: number) => {
        const product = productMap.get(productId);

        return (
          <Space direction="vertical" size={0}>
            <Typography.Text strong>{product?.productName}</Typography.Text>
            <Typography.Text type="secondary">
              {product?.productCode} · {product?.unit}
            </Typography.Text>
          </Space>
        );
      },
    },
    {
      title: '수량',
      dataIndex: 'orderQty',
      width: 130,
      render: (_, row) => (
        <InputNumber
          min={1}
          value={row.orderQty}
          style={{ width: '100%' }}
          onChange={(value) => updateRow(row.productId, 'orderQty', value ?? 1)}
        />
      ),
    },
    {
      title: '단가',
      dataIndex: 'unitPrice',
      width: 150,
      render: (_, row) => (
        <InputNumber
          min={0}
          value={row.unitPrice}
          style={{ width: '100%' }}
          onChange={(value) => updateRow(row.productId, 'unitPrice', value ?? 0)}
        />
      ),
    },
    {
      title: '금액',
      align: 'right',
      width: 140,
      render: (_, row) => `${(row.orderQty * row.unitPrice).toLocaleString()}원`,
    },
    {
      title: '',
      width: 80,
      align: 'center',
      render: (_, row) => (
        <Button danger size="small" onClick={() => removeRow(row.productId)}>
          삭제
        </Button>
      ),
    },
  ];

  return (
    <ErpLayout title="판매 주문 등록">
      <Button style={{ alignSelf: 'flex-start' }} onClick={() => router.back()}>
        목록으로
      </Button>

      <Card
        extra={
          <Button type="primary" onClick={openPicker}>
            의약품 추가
          </Button>
        }
      >
        <Form layout="vertical">
          <Flex gap={16}>
            <Form.Item label="판매처" required style={{ flex: 1 }}>
              <Select
                placeholder="판매처 선택"
                value={customerId}
                onChange={setCustomerId}
                options={customers.map((customer) => ({
                  label: customer.customerName,
                  value: customer.customerId,
                }))}
              />
            </Form.Item>
            <Form.Item label="메모" style={{ flex: 2 }}>
              <Input placeholder="주문 관련 메모를 입력하세요" value={memo} onChange={(e) => setMemo(e.target.value)} />
            </Form.Item>
          </Flex>
        </Form>
      </Card>

      <Card title={`주문 품목 ${rows.length}개`}>
        <Table
          rowKey="productId"
          columns={columns}
          dataSource={rows}
          pagination={false}
          locale={{
            emptyText: '의약품 추가 버튼으로 품목을 추가하세요.',
          }}
        />
      </Card>

      <Flex justify="flex-end">
        <Typography.Text>
          총금액{' '}
          <Typography.Text strong style={{ fontSize: 18 }}>
            {totalAmount.toLocaleString()}원
          </Typography.Text>
        </Typography.Text>
      </Flex>

      <div className="erp-page-actions">
        <Button onClick={() => router.back()}>취소</Button>
        <Button type="primary" loading={processing} onClick={handleSubmit}>
          판매 주문 등록
        </Button>
      </div>

      <Modal
        title="의약품 추가"
        open={pickerOpen}
        onCancel={() => setPickerOpen(false)}
        onOk={addChecked}
        okText="선택 추가"
        cancelText="취소"
        width={620}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Typography.Text type="secondary">
            추가할 의약품을 검색하고 선택하세요. 이미 선택된 의약품은 제외됩니다.
          </Typography.Text>

          <Input.Search
            placeholder="의약품명 또는 코드 검색"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            allowClear
          />

          <List
            bordered
            style={{ maxHeight: 360, overflow: 'auto' }}
            dataSource={filteredProducts}
            locale={{
              emptyText: keyword ? '검색 결과가 없습니다.' : '추가 가능한 의약품이 없습니다.',
            }}
            renderItem={(product) => (
              <List.Item
                style={{
                  cursor: 'pointer',
                  background: checked.has(product.productId) ? '#F0FAF3' : undefined,
                }}
                onClick={() => toggleCheck(product.productId)}
              >
                <Checkbox checked={checked.has(product.productId)} />
                <div style={{ flex: 1, marginLeft: 12 }}>
                  <Typography.Text strong>{product.productName}</Typography.Text>
                  <br />
                  <Typography.Text type="secondary">
                    {product.productCode} · {product.standardSalesPrice?.toLocaleString()}원
                  </Typography.Text>
                </div>
              </List.Item>
            )}
          />

          <Typography.Text type="secondary">{checked.size}개 선택됨</Typography.Text>
        </Space>
      </Modal>
    </ErpLayout>
  );
}
