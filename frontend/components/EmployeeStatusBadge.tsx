// components/EmployeeStatusBadge.tsx — 직원 계정 상태 뱃지
import type { EmployeeStatus } from "@/lib/api";

const LABELS: Record<EmployeeStatus, string> = {
  PENDING: "승인 대기",
  ACTIVE: "재직",
  REJECTED: "거절",
  INACTIVE: "비활성",
  TERMINATED: "퇴사",
};

export default function EmployeeStatusBadge({ status }: { status: EmployeeStatus }) {
  return <span className={`erp-badge ${status}`}>{LABELS[status] ?? status}</span>;
}

const ROLE_LABELS: Record<string, string> = {
  STAFF: "사원",
  MANAGER: "매니저",
  ADMIN: "관리자",
};

export function roleLabel(roleCode: string): string {
  return ROLE_LABELS[roleCode] ?? roleCode;
}
