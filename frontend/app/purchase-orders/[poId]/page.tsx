"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Input,
  Modal,
  Popconfirm,
  Space,
  Spin,
  Table,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  ArrowLeftOutlined,
  CheckOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import ErpLayout from "@/components/ErpLayout";
import StatusBadge from "@/components/StatusBadge";
import { purchaseOrderApi, PurchaseOrder } from "@/lib/api";

const { Text } = Typography;
const { TextArea } = Input;

type PurchaseOrderDetail = NonNullable<PurchaseOrder["details"]>[number];

export default function PurchaseOrderDetailPage() {
  const { poId } = useParams<{ poId: string }>();
  const router = useRouter();

  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [error, setError] = useState("");
  const [role, setRole] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const load = () => {
    purchaseOrderApi
      .detail(Number(poId))
      .then(setOrder)
      .catch((e: Error) => setError(e.message));
  };

  useEffect(load, [poId]);

  useEffect(() => {
    const timer = setTimeout(() => setRole(localStorage.getItem("role") ?? ""), 0);
    return () => clearTimeout(timer);
  }, []);

  const handleApprove = async () => {
    setProcessing(true);

    try {
      await purchaseOrderApi.approve(Number(poId));
      router.push("/purchase-orders");
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert("반려 사유를 입력해주세요.");
      return;
    }

    setProcessing(true);

    try {
      await purchaseOrderApi.reject(Number(poId), rejectReason);
      setShowRejectModal(false);
      router.push("/purchase-orders");
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  const columns: ColumnsType<PurchaseOrderDetail> = [
    {
      title: "상품코드",
      dataIndex: "productCode",
    },
    {
      title: "상품명",
      dataIndex: "productName",
    },
    {
      title: "수량",
      dataIndex: "orderQty",
      align: "right",
      render: (value) => value?.toLocaleString(),
    },
    {
      title: "단가",
      dataIndex: "unitPrice",
      align: "right",
      render: (value) => `${value?.toLocaleString() ?? 0}원`,
    },
    {
      title: "금액",
      dataIndex: "amount",
      align: "right",
      render: (value) => `${value?.toLocaleString() ?? 0}원`,
    },
  ];

  if (error) {
    return (
      <ErpLayout title="발주 상세">
        <Alert type="error" message={error} showIcon />
      </ErpLayout>
    );
  }

  if (!order) {
    return (
      <ErpLayout title="발주 상세">
        <Spin />
      </ErpLayout>
    );
  }

  const canApprove =
    order.status === "REQUESTED" && (role === "MANAGER" || role === "ADMIN");

  return (
    <ErpLayout title={`발주 상세 - PO-${String(order.poId).padStart(4, "0")}`}>
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
            목록으로
          </Button>

          <StatusBadge status={order.status} />
        </Space>

        <Card>
          <Descriptions column={3} bordered size="middle">
            <Descriptions.Item label="공급처">
              <Space direction="vertical" size={2}>
                <Text strong>{order.supplierName}</Text>
                {order.supplierPhone && (
                  <Text type="secondary">{order.supplierPhone}</Text>
                )}
              </Space>
            </Descriptions.Item>

            <Descriptions.Item label="기안자">
              <Space direction="vertical" size={2}>
                <Text strong>{order.requestEmpName}</Text>
                <Text type="secondary">
                  발주일 {order.poDate?.slice(0, 10)}
                </Text>
              </Space>
            </Descriptions.Item>

            <Descriptions.Item label="총금액">
              <Space direction="vertical" size={2}>
                <Text strong>
                  {order.totalAmount?.toLocaleString() ?? 0}
                </Text>
                {order.approveEmpName && (
                  <Text type="secondary">승인자 {order.approveEmpName}</Text>
                )}
              </Space>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Table
          rowKey="poDetailId"
          columns={columns}
          dataSource={order.details ?? []}
          pagination={false}
        />

        {order.memo && (
          <Alert type="info" message={`메모: ${order.memo}`} showIcon />
        )}

        {canApprove && (
          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button
              danger
              icon={<CloseOutlined />}
              disabled={processing}
              onClick={() => setShowRejectModal(true)}
            >
              반려
            </Button>

            <Popconfirm
              title="발주 승인"
              description="이 발주를 승인하시겠습니까?"
              okText="승인"
              cancelText="취소"
              onConfirm={handleApprove}
            >
              <Button
                type="primary"
                icon={<CheckOutlined />}
                loading={processing}
              >
                승인
              </Button>
            </Popconfirm>
          </Space>
        )}

        <Modal
          title="발주 반려"
          open={showRejectModal}
          okText="반려"
          cancelText="취소"
          okButtonProps={{ danger: true, loading: processing }}
          onOk={handleReject}
          onCancel={() => setShowRejectModal(false)}
        >
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            <Text type="secondary">
              입력한 반려 사유는 기안자에게 전달됩니다.
            </Text>

            <TextArea
              rows={4}
              placeholder="반려 사유를 입력하세요"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </Space>
        </Modal>
      </Space>
    </ErpLayout>
  );
}
