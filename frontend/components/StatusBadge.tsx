import { Tag } from "antd";
import { statusLabel } from "@/lib/display-labels";

const STATUS_COLOR: Record<string, string> = {
  REQUESTED: "gold",
  APPROVED: "green",
  REJECTED: "red",
  COMPLETED: "blue",
  SHIPPED: "green",
  CANCELED: "red",
  PENDING: "gold",
  ACTIVE: "green",
  INACTIVE: "default",
  TERMINATED: "red",
  UNPAID: "red",
  PARTIAL: "gold",
  PAID: "green",
  NORMAL: "green",
  SOLD_OUT: "red",
  GOOD: "green",
  WARNING: "gold",
  DANGER: "red",
};

export default function StatusBadge({ status }: { status?: string }) {
  return <Tag color={STATUS_COLOR[status ?? ""] ?? "default"}>{statusLabel(status)}</Tag>;
}
