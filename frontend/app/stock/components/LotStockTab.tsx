'use client';

import { useState, useEffect } from 'react';
import { Button, Card, Input, Select, Space, Table, Tag, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { LotStock, stockMovementApi } from '@/lib/api';
import { App } from 'antd';

export default function LotStockTab() {
  const { message } = App.useApp();
  const [lotStocks, setLotStocks] = useState<LotStock[]>([]);
  const [allLotStocks, setAllLotStocks] = useState<LotStock[]>([]);
  const [productName, setProductName] = useState('');
  const [productCode, setProductCode] = useState('');
  const [lotNo, setLotNo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expiryStatus, setExpiryStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const handleReset = () => {
    setProductName('');
    setProductCode('');
    setLotNo('');
    setExpiryStatus('');
    setLotStocks(allLotStocks);
    setCurrentPage(1);
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const result = await stockMovementApi.searchLotStockList();
        setAllLotStocks(result);
        setLotStocks(result);
      } catch (error) {
        message.error((error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    void loadInitialData();
  }, [message]);

  const handleSearch = () => {
    const name = productName.trim();
    const code = productCode.trim();
    const lot = lotNo.trim();

    const filtered = allLotStocks.filter((item) => {
      const matchedName = !name || item.productName.includes(name);
      const matchedCode = !code || item.productCode.includes(code);
      const matchedLotNo = !lot || item.lotNo.includes(lot);
      const matchedExpiry =
        !expiryStatus ||
        (expiryStatus === 'NORMAL' && item.daysLeft > 90) ||
        (expiryStatus === 'EXPIRY_90' && item.daysLeft >= 31 && item.daysLeft <= 90) ||
        (expiryStatus === 'EXPIRY_30' && item.daysLeft >= 11 && item.daysLeft <= 30) ||
        (expiryStatus === 'EXPIRY_10' && item.daysLeft >= 0 && item.daysLeft <= 10) ||
        (expiryStatus === 'EXPIRED' && item.daysLeft < 0);
      return matchedName && matchedCode && matchedLotNo && matchedExpiry;
    });
    setLotStocks(filtered);
    setCurrentPage(1);
  };

  const columns: ColumnsType<LotStock> = [
    {
      title: '상품코드',
      dataIndex: 'productCode',
    },
    {
      title: '상품명',
      dataIndex: 'productName',
    },
    {
      title: '로트번호',
      dataIndex: 'lotNo',
      sorter: (a, b) => a.lotNo.localeCompare(b.lotNo),
    },
    {
      title: '유효기간',
      dataIndex: 'expiryDate',
      render: (value?: string) => value?.slice(0, 10) ?? '-',
      sorter: (a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime(),
    },
    {
      title: '잔여일',
      dataIndex: 'daysLeft',
      align: 'right',
      render: (value?: number) => `${value ?? 0}일`,
    },
    {
      title: '유효기간 상태',
      render: (_, record) => {
        let label = '정상';
        let color = 'green';
        if (record.daysLeft < 0) {
          label = '만료';
          color = 'red';
        } else if (record.daysLeft <= 10) {
          label = '10일 이내';
          color = 'red';
        } else if (record.daysLeft <= 30) {
          label = '30일 이내';
          color = 'gold';
        } else if (record.daysLeft <= 90) {
          label = '90일 이내';
          color = 'orange';
        }
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: '현재수량',
      dataIndex: 'qty',
      align: 'right',
      render: (value?: number) => value?.toLocaleString() ?? 0,
    },
    {
      title: '보관위치',
      dataIndex: 'location',
      render: (value?: string) => value || '-',
    },
  ];
  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(180px, 1.2fr) minmax(180px, 1fr) 1fr auto',
            gap: 12,
            alignItems: 'center',
          }}
        >
          <Input
            placeholder="로트번호"
            value={lotNo}
            onChange={(e) => setLotNo(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
          />

          <Select
            placeholder="유효기간 상태"
            value={expiryStatus || undefined}
            onChange={(value) => setExpiryStatus(value ?? '')}
            allowClear
            style={{ width: '100%' }}
            options={[
              { value: 'NORMAL', label: '정상' },
              { value: 'EXPIRY_90', label: '90일 이내' },
              { value: 'EXPIRY_30', label: '30일 이내' },
              { value: 'EXPIRY_10', label: '10일 이내' },
              { value: 'EXPIRED', label: '만료' },
            ]}
          />

          <div />

          <Space size={8}>
            <Button onClick={handleReset}>초기화</Button>
            <Button type="primary" onClick={handleSearch}>
              검색
            </Button>
          </Space>
        </div>
      </Card>
      <Card
        title="로트별 재고"
        extra={<Typography.Text type="secondary">총 {lotStocks.length.toLocaleString()}건</Typography.Text>}
        styles={{ body: { padding: 0 } }}
      >
        <Table
          columns={columns}
          dataSource={lotStocks}
          rowKey="inventoryLotId"
          loading={loading}
          locale={{
            emptyText: '조회된 로트별 재고가 없습니다.',
          }}
          pagination={{
            current: currentPage,
            pageSize: 10,
            showSizeChanger: false,
            onChange: (page) => {
              setCurrentPage(page);
            },
          }}
        />
      </Card>
    </>
  );
}
