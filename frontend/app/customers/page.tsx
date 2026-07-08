"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Table, Tabs, Input, Button, Alert, Space, Tag } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import ErpLayout from "@/components/ErpLayout";
import { customerApi, Customer } from "@/lib/api";

const TYPE_LABEL: Record<string, string> = {
  PHARMACY: "약국",
  HOSPITAL: "병의원",
};

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [typeTab, setTypeTab] = useState("");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadCustomers = async (type: string, kw: string) => {
    setLoading(true);
    setError("");
    try {
      const data = await customerApi.list(type || undefined, "ACTIVE", kw || undefined);
      setCustomers(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "거래처 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => loadCustomers(typeTab, ""), 0);
    return () => clearTimeout(timer);
  }, [typeTab]);

  const handleSearch = () => loadCustomers(typeTab, keyword);

  const columns: ColumnsType<Customer> = [
    { title: "거래처명", dataIndex: "customerName", key: "customerName" },
    {
      title: "유형",
      dataIndex: "customerType",
      key: "customerType",
      width: 90,
      render: (type: string) => (
        <Tag color={type === "PHARMACY" ? "green" : "blue"}>
          {TYPE_LABEL[type] ?? type}
        </Tag>
      ),
    },
    {
      title: "사업자번호",
      dataIndex: "businessNo",
      key: "businessNo",
      render: (v: string | null) => v ?? "-",
    },
    {
      title: "연락처",
      dataIndex: "phone",
      key: "phone",
      render: (v: string | null) => v ?? "-",
    },
    {
      title: "주소",
      dataIndex: "address",
      key: "address",
      ellipsis: true,
      render: (v: string | null) => v ?? "-",
    },
    {
      title: "여신한도",
      dataIndex: "creditLimit",
      key: "creditLimit",
      align: "right",
      render: (v: number) => `${v.toLocaleString()}원`,
    },
    {
      title: "미수금",
      dataIndex: "receivableBalance",
      key: "receivableBalance",
      align: "right",
      render: (v: number) => `${v.toLocaleString()}원`,
    },
  ];

  return (
    <ErpLayout title="거래처 관리">
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Tabs
            activeKey={typeTab}
            onChange={setTypeTab}
            items={[
              { key: "", label: "전체" },
              { key: "PHARMACY", label: "약국" },
              { key: "HOSPITAL", label: "병의원" },
            ]}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => router.push("/customers/new")}
          >
            거래처 등록
          </Button>
        </div>

        <Space>
          <Input
            placeholder="거래처명 검색"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 240 }}
            allowClear
          />
          <Button onClick={handleSearch}>검색</Button>
        </Space>

        {error && <Alert type="error" title={error} showIcon />}

        <Table
          rowKey="customerId"
          columns={columns}
          dataSource={customers}
          loading={loading}
          pagination={{ pageSize: 20 }}
          onRow={(record) => ({
            onClick: () => router.push(`/customers/${record.customerId}`),
            style: { cursor: "pointer" },
          })}
          locale={{ emptyText: "등록된 거래처가 없습니다." }}
        />
      </Space>
    </ErpLayout>
  );
}
