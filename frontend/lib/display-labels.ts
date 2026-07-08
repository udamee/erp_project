export const STATUS_LABELS: Record<string, string> = {
  REQUESTED: "승인 대기",
  APPROVED: "승인 완료",
  REJECTED: "반려",
  COMPLETED: "완료",
  SHIPPED: "출고 완료",
  CANCELED: "취소",
  PENDING: "대기",
  ACTIVE: "사용",
  INACTIVE: "비활성",
  TERMINATED: "퇴사",
  UNPAID: "미납",
  PARTIAL: "부분 납부",
  PAID: "완납",
  NORMAL: "정상",
  SOLD_OUT: "소진",
  GOOD: "양호",
  WARNING: "주의",
  DANGER: "위험",
  CRITICAL: "긴급",
  INFO: "안내",
};

export const PAYMENT_TYPE_LABELS: Record<string, string> = {
  BANK_TRANSFER: "계좌이체",
  TRANSFER: "계좌이체",
  CASH: "현금",
  CARD: "카드",
  계좌이체: "계좌이체",
  현금: "현금",
  카드: "카드",
};

export function statusLabel(status?: string) {
  if (!status) return "미지정";
  return STATUS_LABELS[status] ?? status;
}

export function paymentTypeLabel(type?: string) {
  if (!type) return "-";
  return PAYMENT_TYPE_LABELS[type] ?? type;
}
