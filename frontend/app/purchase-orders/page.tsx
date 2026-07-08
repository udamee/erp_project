"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Pagination, Space, Table, Tabs, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined } from "@ant-design/icons";
import ErpLayout from "@/components/ErpLayout";
import StatusBadge from "@/components/StatusBadge";
import { purchaseOrderApi, PurchaseOrder } from "@/lib/api";

const { Text } = Typography;

const TABS = [
  { key: "", label: "전체" },
  { key: "REQUESTED", label: "승인 대기" },
  { key: "APPROVED", label: "승인 완료" },
  { key: "REJECTED", label: "반려" },
  { key: "COMPLETED", label: "입고 완료" },
];

export default function PurchaseOrderListPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [tab, setTab] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    purchaseOrderApi.statusCounts().then(setCounts).catch(() => {});
  }, [orders]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);

      purchaseOrderApi
        .listPaging(tab, page, 10)
        .then((res) => {
          setOrders(res.list);
          setTotalPages(res.totalPages);
          setTotal(res.total);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(timer);
  }, [tab, page]);

  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

  const columns: ColumnsType<PurchaseOrder> = [
    {
      title: "발주번호",
      dataIndex: "poId",
      render: (poId) => `PO-${String(poId).padStart(4, "0")}`,
    },
    {
      title: "공급처",
      dataIndex: "supplierName",
    },
    {
      title: "기안자",
      dataIndex: "requestEmpName",
    },
    {
      title: "발주일",
      dataIndex: "poDate",
      render: (value) => value?.slice(0, 10),
    },
    {
      title: "상태",
      dataIndex: "status",
      render: (status) => <StatusBadge status={status} />,
    },
    {
      title: "총금액",
      dataIndex: "totalAmount",
      align: "right",
      render: (value) => `${value?.toLocaleString() ?? 0}원`,
    },
  ];

  const tabItems = useMemo(
    () =>
      TABS.map((item) => {
        const count = item.key === "" ? totalCount : counts[item.key] ?? 0;

        return {
          key: item.key,
          label: `${item.label} ${count}`,
        };
      }),
    [counts, totalCount],
  );

  return (
    <ErpLayout title="발주 관리">
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Tabs
          activeKey={tab}
          items={tabItems}
          onChange={(key) => {
            setTab(key);
            setPage(1);
          }}
        />

        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Text type="secondary">총 {total}건</Text>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => router.push("/purchase-orders/new")}
          >
            발주 등록
          </Button>
        </Space>

        <Table
          rowKey="poId"
          columns={columns}
          dataSource={orders}
          loading={loading}
          pagination={false}
          onRow={(record) => ({
            onClick: () => router.push(`/purchase-orders/${record.poId}`),
            style: { cursor: "pointer" },
          })}
        />

        {totalPages > 1 && (
          <Pagination
            current={page}
            total={total}
            pageSize={10}
            align="center"
            onChange={setPage}
            showSizeChanger={false}
          />
        )}
      </Space>
    </ErpLayout>
  );
}
