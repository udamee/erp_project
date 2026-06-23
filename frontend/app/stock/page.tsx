'use client';

import { useState } from 'react';
import { Tabs } from 'antd';
import ErpLayout from '@/components/ErpLayout';
import ProductStockTab from './components/ProductStockTab';
import LotStockTab from './components/LotStockTab';
import StockMovementTab from './components/StockMovementTab';

const TABS = [
  { key: 'HISTORY', label: '재고 이동 이력' },
  { key: 'PRODUCT', label: '상품별 재고' },
  { key: 'LOT', label: '로트별 재고' },
];

export default function StockPage() {
  const [tab, setTab] = useState('HISTORY');

  return (
    <ErpLayout title="재고 관리">
      <Tabs activeKey={tab} items={TABS} onChange={setTab} />
      {tab === 'HISTORY' && <StockMovementTab />}
      {tab === 'PRODUCT' && <ProductStockTab />}
      {tab === 'LOT' && <LotStockTab />}
    </ErpLayout>
  );
}
