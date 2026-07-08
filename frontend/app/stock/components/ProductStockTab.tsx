'use client';

import { useEffect, useState } from 'react';

import { ProductStock, stockMovementApi } from '@/lib/api';
import { ColumnsType } from 'antd/es/table';
import { App, Button, Card, Checkbox, Input, Select, Space, Tag, Table, Typography } from 'antd';

export default function ProductStockTab() {
  const { message } = App.useApp();
  const [productStocks, setProductStocks] = useState<ProductStock[]>([]);
  const [productName, setProductName] = useState('');
  const [productCode, setProductCode] = useState('');
  const [stockStatus, setStockStatus] = useState('');
  const [safetyOnly, setSafetyOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allProductStocks, setAllProductStocks] = useState<ProductStock[]>([]);

  const handleReset = () => {
    setProductName('');
    setProductCode('');
    setStockStatus('');
    setSafetyOnly(false);
    setProductStocks(allProductStocks);
  };

  useEffect(() => {
    const loadingInitialData = async () => {
      try {
        const result = await stockMovementApi.searchProductList();
        const mapped = result.map((item) => {
          let stockStatus = 'NORMAL';
          if (item.availableQty <= 0) {
            stockStatus = 'SOLD_OUT';
          } else if (item.availableQty <= item.safetyQty) {
            stockStatus = 'DANGER';
          }
          return {
            ...item,
            stockStatus,
          };
        });
        setAllProductStocks(mapped);
        setProductStocks(mapped);
      } catch (error) {
        message.error((error as Error).message);
      } finally {
        setLoading(false);
      }
    };
    void loadingInitialData();
  }, [message]);

  const handleSearch = () => {
    const filtered = allProductStocks.filter((item) => {
      const matchedName = !productName.trim() || item.productName.includes(productName.trim());
      const matchedCode = !productCode.trim() || item.productCode.includes(productCode.trim());
      const matchedStatus = !stockStatus || item.stockStatus === stockStatus;
      const matchedSafety = !safetyOnly || item.availableQty <= item.safetyQty;
      return matchedName && matchedCode && matchedStatus && matchedSafety;
    });

    setProductStocks(filtered);
  };

  const columns: ColumnsType<ProductStock> = [
    {
      title: '상품코드',
      dataIndex: 'productCode',
      sorter: (a, b) => a.productCode.localeCompare(b.productCode),
    },
    {
      title: '상품명',
      dataIndex: 'productName',
    },
    {
      title: '가용재고',
      dataIndex: 'availableQty',
      align: 'right',
      render: (value?: number) => value?.toLocaleString() ?? 0,
    },
    {
      title: '안전재고',
      dataIndex: 'safetyQty',
      align: 'right',
      render: (value?: number) => value?.toLocaleString() ?? 0,
    },
    {
      title: '출고 가능 수량',
      dataIndex: 'shippableQty',
      align: 'right',
      render: (value?: number) => Math.max(value ?? 0, 0).toLocaleString(),
    },
    {
      title: '재고 상태',
      dataIndex: 'stockStatus',
      render: (value: string) => {
        const statusMap: Record<string, { label: string; color: string }> = {
          NORMAL: { label: '정상', color: 'green' },
          DANGER: { label: '부족', color: 'orange' },
          SOLD_OUT: { label: '품절', color: 'red' },
        };
        const status = statusMap[value];
        return <Tag color={status?.color}>{status?.label ?? value}</Tag>;
      },
    },
  ];
  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr 180px auto',
            gap: 12,
            alignItems: 'center',
          }}
        >
          <Input
            placeholder="상품명"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
          />
          <Input
            placeholder="상품코드"
            value={productCode}
            onChange={(e) => setProductCode(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
          />
          <Select
            placeholder="재고상태"
            value={stockStatus || undefined}
            onChange={(value) => setStockStatus(value ?? '')}
            allowClear
            options={[
              { value: 'NORMAL', label: '정상' },
              { value: 'DANGER', label: '부족' },
              { value: 'SOLD_OUT', label: '품절' },
            ]}
          />
          <Checkbox checked={safetyOnly} onChange={(e) => setSafetyOnly(e.target.checked)}>
            안전재고 이하만
          </Checkbox>
        </div>
        <Space style={{ width: '100%', justifyContent: 'flex-end', marginTop: 16 }}>
          <Button onClick={handleReset}>초기화</Button>
          <Button type="primary" onClick={handleSearch}>
            검색
          </Button>
        </Space>
      </Card>
      <Card
        title="상품별 재고"
        extra={<Typography.Text type="secondary"> 총 {productStocks.length.toLocaleString()}건</Typography.Text>}
        styles={{ body: { padding: 0 } }}
      >
        <Table
          columns={columns}
          dataSource={productStocks}
          rowKey={'productId'}
          loading={loading}
          locale={{
            emptyText: '조회된 상품 재고가 없습니다.',
          }}
        />
      </Card>
    </>
  );
}
