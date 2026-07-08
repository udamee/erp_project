"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Space,
  Statistic,
  Switch,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { ReloadOutlined } from "@ant-design/icons";
import ErpLayout from "@/components/ErpLayout";
import { recallApi, RecallDrug } from "@/lib/api";

const { Text } = Typography;

function formatDate(d: string | null) {
  if (!d || d.length < 8) return "-";
  return `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6, 8)}`;
}

export default function RecallDrugsPage() {
  const [drugs, setDrugs] = useState<RecallDrug[]>([]);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async (inStockOnly: boolean) => {
    setLoading(true);
    setError("");

    try {
      const data = await recallApi.list(1, 100, inStockOnly);
      setDrugs(data);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "위해의약품 정보를 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => load(onlyInStock), 0);
    return () => clearTimeout(timer);
  }, [onlyInStock]);

  const inStockCount = drugs.filter((drug) => drug.inStock).length;

  const columns: ColumnsType<RecallDrug> = [
    {
      title: "취급",
      dataIndex: "inStock",
      width: 90,
      render: (inStock) =>
        inStock ? <Tag color="error">취급중</Tag> : <Tag>-</Tag>,
    },
    {
      title: "품목명",
      dataIndex: "productName",
      width: 220,
      render: (value) => <Text strong>{value}</Text>,
    },
    {
      title: "업체명",
      dataIndex: "entrpsName",
      width: 180,
    },
    {
      title: "회수사유",
      dataIndex: "recallReason",
      ellipsis: true,
    },
    {
      title: "강제여부",
      dataIndex: "enforceYn",
      width: 100,
      render: (value) =>
        value === "Y" ? <Tag color="red">강제</Tag> : <Tag color="blue">자율</Tag>,
    },
    {
      title: "회수명령일",
      dataIndex: "commandDate",
      width: 130,
      render: formatDate,
    },
  ];

  return (
    <ErpLayout title="위해의약품 현황">
      <Space orientation="vertical" size={16} style={{ width: "100%" }}>
        <Space size={16} wrap>
          <Card style={{ width: 240 }}>
            <Statistic title="조회된 회수·판매중지" value={drugs.length} suffix="건" />
          </Card>

          <Card style={{ width: 260 }}>
            <Statistic
                title="우리 취급 품목 (회수 대상)"
                value={inStockCount}
                suffix="건"
                styles={{
                    content: {
                    color: inStockCount > 0 ? "#cf1322" : undefined,
                    },
                }}
            />
          </Card>
        </Space>

        <Text type="secondary">
          식약처 의약품 회수·판매중지 정보와 우리 재고를 대조해, 취급 중인 회수 대상 의약품을 표시합니다.
        </Text>

        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Space>
            <Switch checked={onlyInStock} onChange={setOnlyInStock} />
            <Text>우리 취급 품목만 보기</Text>
          </Space>

          <Button
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={() => load(onlyInStock)}
          >
            새로고침
          </Button>
        </Space>

        {error && <Alert type="error" message={error} showIcon />}

        <Table
          rowKey={(record) => `${record.itemSeq}-${record.commandDate}-${record.productName}`}
          columns={columns}
          dataSource={drugs}
          loading={loading}
          pagination={{ pageSize: 10 }}
          rowClassName={(record) => (record.inStock ? "recall-row-danger" : "")}
          locale={{
            emptyText: onlyInStock
              ? "취급 중인 회수 대상 의약품이 없습니다."
              : "조회된 회수 의약품이 없습니다.",
          }}
        />
      </Space>
    </ErpLayout>
  );
}