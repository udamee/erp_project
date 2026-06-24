"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Alert,
  Button,
  DatePicker,
  Input,
  InputNumber,
  Popconfirm,
  Space,
  Table,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { ArrowLeftOutlined, CheckOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import ErpLayout from "@/components/ErpLayout";
import { receivingApi, ReceivingDetailInput } from "@/lib/api";

const { Text } = Typography;

export default function ReceivingProcessPage() {
  const { poId } = useParams<{ poId: string }>();
  const router = useRouter();

  const [rows, setRows] = useState<ReceivingDetailInput[]>([]);
  const [memo, setMemo] = useState("");
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    receivingApi
      .detailsByPoId(Number(poId))
      .then((details) =>
        setRows(
          details.map((detail) => ({
            productId: detail.productId,
            productName: detail.productName,
            orderQty: detail.orderQty,
            lotNo: "",
            expiryDate: "",
            receivedQty: detail.orderQty,
            unitPrice: detail.unitPrice,
          })),
        ),
      )
      .catch((e: Error) => setError(e.message));
  }, [poId]);

  const updateRow = (
    index: number,
    field: keyof ReceivingDetailInput,
    value: string | number,
  ) => {
    setRows((prev) =>
      prev.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row,
      ),
    );
  };

  const isExpired = (date: string) =>
    date !== "" && dayjs(date).isBefore(dayjs(), "day");

  const handleSubmit = async () => {
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
        message.warning(`${row.productName}: 이미 지난 유효기간입니다.`);
        return;
      }

      if (!row.receivedQty || row.receivedQty < 1) {
        message.warning(`${row.productName}: 입고수량을 확인해주세요.`);
        return;
      }
    }

    setProcessing(true);

    try {
      await receivingApi.process({
        poId: Number(poId),
        memo: memo || undefined,
        details: rows.map(({ productName, orderQty, ...rest }) => rest),
      });

      message.success("입고 처리가 완료되었습니다.");
      router.push("/receivings");
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  const columns: ColumnsType<ReceivingDetailInput> = [
    {
      title: "상품명",
      dataIndex: "productName",
      render: (value) => <Text strong>{value}</Text>,
    },
    {
      title: "발주수량",
      dataIndex: "orderQty",
      align: "right",
      width: 110,
      render: (value) => value?.toLocaleString(),
    },
    {
      title: "로트번호",
      dataIndex: "lotNo",
      width: 180,
      render: (value, _row, index) => (
        <Input
          placeholder="LOT-2606-A01"
          value={value}
          onChange={(e) => updateRow(index, "lotNo", e.target.value)}
        />
      ),
    },
    {
      title: "유효기간",
      dataIndex: "expiryDate",
      width: 180,
      render: (value, _row, index) => (
        <DatePicker
          value={value ? dayjs(value) : null}
          status={isExpired(value) ? "error" : undefined}
          style={{ width: "100%" }}
          onChange={(date) =>
            updateRow(index, "expiryDate", date ? date.format("YYYY-MM-DD") : "")
          }
        />
      ),
    },
    {
      title: "입고수량",
      dataIndex: "receivedQty",
      width: 130,
      render: (value, _row, index) => (
        <InputNumber
          min={1}
          value={value}
          style={{ width: "100%" }}
          onChange={(nextValue) =>
            updateRow(index, "receivedQty", nextValue ?? 0)
          }
        />
      ),
    },
  ];

  const hasExpiredItem = rows.some((row) => isExpired(row.expiryDate));

  return (
    <ErpLayout title={`입고 처리 - PO-${String(poId).padStart(4, "0")}`}>
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
          목록으로
        </Button>

        {error && <Alert type="error" message={error} showIcon />}

        <Table
          rowKey="productId"
          columns={columns}
          dataSource={rows}
          pagination={false}
          locale={{ emptyText: "입고할 품목이 없습니다." }}
        />

        {hasExpiredItem && (
          <Alert
            type="warning"
            message="유효기간이 지난 품목이 있습니다. 날짜를 확인해주세요."
            showIcon
          />
        )}

        <Space direction="vertical" size={6} style={{ width: "100%" }}>
          <Text strong>메모</Text>
          <Input
            placeholder="입고 관련 메모를 입력하세요"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </Space>

        <Space style={{ width: "100%", justifyContent: "flex-end" }}>
          <Button onClick={() => router.back()}>취소</Button>

          <Popconfirm
            title="입고 처리"
            description="입고 처리 후 재고 로트를 생성하시겠습니까?"
            okText="처리"
            cancelText="취소"
            onConfirm={handleSubmit}
          >
            <Button
              type="primary"
              icon={<CheckOutlined />}
              loading={processing}
              disabled={rows.length === 0}
            >
              입고 완료
            </Button>
          </Popconfirm>
        </Space>
      </Space>
    </ErpLayout>
  );
}
