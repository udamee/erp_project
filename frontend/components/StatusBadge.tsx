import { Tag } from "antd";

const STATUS_META: Record<string, { label: string; color: string }> = {
  REQUESTED: { label: "승인 대기", color: "gold" },
  APPROVED: { label: "승인 완료", color: "green" },
  REJECTED: { label: "반려", color: "red" },
  COMPLETED: { label: "입고 완료", color: "blue" },
  SHIPPED: { label: "출고 완료", color: "green" },
  CANCELED: { label: "취소됨", color: "red" },
  NORMAL: { label: "정상", color: "green" },
  SOLD_OUT: { label: "품절", color: "red" },
  GOOD: { label: "양호", color: "green" },
  WARNING: { label: "주의", color: "gold" },
  DANGER: { label: "위험", color: "red" },
};

export default function StatusBadge({ status }: { status?: string }) {
  if (!status) return <Tag>미지정</Tag>;

  const meta = STATUS_META[status];

  return <Tag color={meta?.color ?? "default"}>{meta?.label ?? status}</Tag>;
}