"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  CrownOutlined,
  DollarOutlined,
  InboxOutlined,
  SafetyCertificateOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  UserOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import ErpLayout from "@/components/ErpLayout";
import { roleLabel } from "@/components/EmployeeStatusBadge";
import { useAsyncData, useAuthUser } from "@/lib/hooks";
import {
  adminEmployeeApi,
  attendanceApi,
  customerApi,
  employeeApi,
  purchaseOrderApi,
  recallApi,
  type Employee,
} from "@/lib/api";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

const PO_STATUS: { key: string; label: string; color: string }[] = [
  { key: "REQUESTED", label: "승인 대기", color: "var(--erp-warning)" },
  { key: "APPROVED", label: "입고 대기", color: "var(--erp-info)" },
  { key: "COMPLETED", label: "완료", color: "var(--erp-primary-dark)" },
  { key: "REJECTED", label: "반려", color: "var(--erp-danger)" },
];

const ROLE_META: Record<string, { color: string; Icon: typeof UserOutlined }> = {
  ADMIN: { color: "#e0820c", Icon: SafetyCertificateOutlined },
  MANAGER: { color: "#185fa5", Icon: CrownOutlined },
  STAFF: { color: "#1d9e75", Icon: UserOutlined },
};

const STATUS_META: Record<string, { label: string; bg: string; fg: string }> = {
  NORMAL: { label: "출근", bg: "var(--erp-primary-bg)", fg: "var(--erp-primary-dark)" },
  LATE: { label: "지각", bg: "var(--erp-warning-bg)", fg: "var(--erp-warning)" },
  EARLY_LEAVE: { label: "조퇴", bg: "var(--erp-warning-bg)", fg: "var(--erp-warning)" },
  ABSENT: { label: "결근", bg: "var(--erp-danger-bg)", fg: "var(--erp-danger)" },
};

function timeOnly(iso: string | null) {
  return iso ? new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) : "-";
}

function StatCard({
  icon,
  label,
  value,
  unit,
  tone = "default",
  loading,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  value: number | string;
  unit?: string;
  tone?: "default" | "primary" | "danger";
  loading?: boolean;
  onClick?: () => void;
}) {
  const accent =
    tone === "danger" ? "var(--erp-danger)" : tone === "primary" ? "var(--erp-primary-dark)" : "var(--erp-text)";
  const iconBg =
    tone === "danger" ? "var(--erp-danger-bg)" : tone === "primary" ? "var(--erp-primary-bg)" : "var(--erp-bg)";

  return (
    <button
      onClick={onClick}
      className="erp-card"
      style={{
        flex: 1,
        minWidth: 180,
        display: "flex",
        alignItems: "center",
        gap: 14,
        textAlign: "left",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <span
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          flexShrink: 0,
          background: iconBg,
          color: accent,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
        }}
      >
        {icon}
      </span>
      <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        <span style={{ fontSize: 13, color: "var(--erp-text-muted)" }}>{label}</span>
        <span style={{ fontSize: 22, fontWeight: 700, color: accent }}>
          {loading ? "-" : value}
          {!loading && unit && <span style={{ fontSize: 13, fontWeight: 500, marginLeft: 2 }}>{unit}</span>}
        </span>
      </span>
    </button>
  );
}

function SectionCard({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="erp-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 700 }}>{title}</span>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const authUser = useAuthUser();
  const role = authUser?.role ?? "STAFF";
  const isAdmin = role === "ADMIN";
  const isManager = role === "MANAGER" || isAdmin;
  const isHR = isAdmin || (role === "MANAGER" && authUser?.deptCode === "DEPT_HR");

  const meData = useAsyncData(() => employeeApi.me(), []);
  const poData = useAsyncData(() => purchaseOrderApi.statusCounts(), []);
  const recallData = useAsyncData(() => recallApi.list(1, 100, true), []);
  const customerData = useAsyncData(() => customerApi.list(undefined, "ACTIVE"), []);
  const pendingData = useAsyncData(
    () => (isHR ? adminEmployeeApi.pending() : Promise.resolve([] as Employee[])),
    [isHR],
  );
  const todayData = useAsyncData(() => attendanceApi.today(), []);

  const poCounts = poData.data ?? {};
  const requested = poCounts.REQUESTED ?? 0;
  const approved = poCounts.APPROVED ?? 0;
  const recallList = recallData.data ?? [];
  const customers = customerData.data ?? [];
  const receivableSum = customers.reduce((sum, customer) => sum + (customer.receivableBalance ?? 0), 0);
  const pendingCount = (pendingData.data ?? []).length;
  const today = todayData.data;

  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const checkedIn = !!today?.checkIn;
  const checkedOut = !!today?.checkOut;

  const handleCheckIn = async () => {
    setBusy(true);
    try {
      await attendanceApi.checkIn();
      todayData.reload();
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleCheckOut = async () => {
    setBusy(true);
    try {
      await attendanceApi.checkOut();
      todayData.reload();
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  let workMinutes = 0;
  if (today?.checkIn) {
    const start = new Date(today.checkIn).getTime();
    const end = today.checkOut ? new Date(today.checkOut).getTime() : now.getTime();
    workMinutes = Math.max(0, Math.floor((end - start) / 60000));
  }

  const statusMeta = checkedIn
    ? STATUS_META[today?.status ?? ""] ?? {
        label: today?.status ?? "-",
        bg: "var(--erp-bg)",
        fg: "var(--erp-text-muted)",
      }
    : { label: "미출근", bg: "var(--erp-bg)", fg: "var(--erp-text-muted)" };

  const displayName = meData.data?.empName ?? authUser?.empName ?? "사용자";
  const roleMeta = ROLE_META[role] ?? ROLE_META.STAFF;
  const RoleIcon = roleMeta.Icon;
  const [dateStr] = useState(() => {
    const date = new Date();
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAYS[date.getDay()]})`;
  });

  const quickLinks = [
    { href: "/attendance", label: "근태 관리" },
    ...(isHR ? [{ href: "/employees", label: "직원 관리" }] : []),
    { href: "/customers", label: "거래처 관리" },
    { href: "/product", label: "상품 관리" },
    { href: "/purchase-orders", label: "발주 관리" },
    ...(isManager ? [{ href: "/admin", label: "관리자" }] : []),
  ];

  const muted: CSSProperties = { fontSize: 13, color: "var(--erp-text-muted)" };

  return (
    <ErpLayout title="대시보드">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
          안녕하세요,{" "}
          <span style={{ color: roleMeta.color }}>
            <RoleIcon /> {roleLabel(role)}
          </span>{" "}
          {displayName}님
        </h2>
        <span style={muted}>{dateStr}</span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 16 }}>
        <StatCard
          icon={<ShoppingCartOutlined />}
          label="발주 승인 대기"
          value={requested}
          unit="건"
          tone={requested > 0 ? "primary" : "default"}
          loading={poData.loading}
          onClick={() => router.push("/purchase-orders")}
        />
        <StatCard
          icon={<InboxOutlined />}
          label="입고 대기"
          value={approved}
          unit="건"
          loading={poData.loading}
          onClick={() => router.push("/purchase-orders/recevings")}
        />
        <StatCard
          icon={<WarningOutlined />}
          label="위해의약품 취급"
          value={recallList.length}
          unit="건"
          tone={recallList.length > 0 ? "danger" : "default"}
          loading={recallData.loading}
          onClick={() => router.push("/recall-drugs")}
        />
        <StatCard
          icon={<DollarOutlined />}
          label="미수금 합계"
          value={receivableSum.toLocaleString()}
          unit="원"
          tone={receivableSum > 0 ? "primary" : "default"}
          loading={customerData.loading}
          onClick={() => router.push("/customers")}
        />
        {isHR && (
          <StatCard
            icon={<TeamOutlined />}
            label="가입 승인 대기"
            value={pendingCount}
            unit="명"
            tone={pendingCount > 0 ? "primary" : "default"}
            loading={pendingData.loading}
            onClick={() => router.push("/employees")}
          />
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
        <SectionCard
          title="발주 현황"
          action={
            <button className="erp-btn" style={{ height: 28 }} onClick={() => router.push("/purchase-orders")}>
              전체 보기
            </button>
          }
        >
          <div style={{ display: "flex", gap: 8 }}>
            {PO_STATUS.map((status) => (
              <div
                key={status.key}
                style={{
                  flex: 1,
                  textAlign: "center",
                  padding: "12px 4px",
                  borderRadius: 8,
                  background: "var(--erp-bg)",
                }}
              >
                <div style={{ fontSize: 22, fontWeight: 700, color: status.color }}>
                  {poData.loading ? "-" : poCounts[status.key] ?? 0}
                </div>
                <div style={muted}>{status.label}</div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="위해의약품 경보"
          action={
            <button className="erp-btn" style={{ height: 28 }} onClick={() => router.push("/recall-drugs")}>
              전체 보기
            </button>
          }
        >
          {recallData.loading ? (
            <p style={muted}>불러오는 중...</p>
          ) : recallList.length === 0 ? (
            <p style={{ ...muted, margin: 0 }}>취급 중인 회수 대상 의약품이 없습니다.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {recallList.slice(0, 4).map((drug, index) => (
                <div
                  key={`${drug.itemSeq}-${index}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                    padding: "8px 10px",
                    background: "var(--erp-danger-bg)",
                    borderRadius: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--erp-danger)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {drug.productName}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--erp-danger)", flexShrink: 0 }}>{drug.entrpsName}</span>
                </div>
              ))}
              {recallList.length > 4 && (
                <span style={{ ...muted, color: "var(--erp-danger)" }}>외 {recallList.length - 4}건</span>
              )}
            </div>
          )}
        </SectionCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
        <SectionCard
          title="내 근태"
          action={
            <span
              style={{
                background: statusMeta.bg,
                color: statusMeta.fg,
                padding: "3px 12px",
                borderRadius: 999,
                fontWeight: 600,
                fontSize: 12,
              }}
            >
              {statusMeta.label}
            </span>
          }
        >
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { label: "출근", value: timeOnly(today?.checkIn ?? null) },
              { label: "퇴근", value: timeOnly(today?.checkOut ?? null) },
              {
                label: "근무 시간",
                value: today?.checkIn ? `${Math.floor(workMinutes / 60)}시간 ${workMinutes % 60}분` : "-",
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  flex: 1,
                  textAlign: "center",
                  padding: "12px 6px",
                  background: "var(--erp-bg)",
                  borderRadius: 10,
                }}
              >
                <div style={{ ...muted, fontSize: 12, marginBottom: 4 }}>{item.label}</div>
                <strong style={{ fontSize: 17 }}>{item.value}</strong>
              </div>
            ))}
          </div>
          <button
            className={`erp-btn ${checkedOut ? "" : "primary"}`}
            style={{ width: "100%", height: 42, marginTop: 12, fontWeight: 700 }}
            disabled={busy || checkedOut}
            onClick={checkedIn ? handleCheckOut : handleCheckIn}
          >
            {checkedOut ? "오늘 근무 완료" : checkedIn ? "퇴근하기" : "출근하기"}
          </button>
        </SectionCard>

        <SectionCard title="빠른 메뉴">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {quickLinks.map((link) => (
              <button key={link.href} className="erp-btn" onClick={() => router.push(link.href)}>
                {link.label}
              </button>
            ))}
          </div>
        </SectionCard>
      </div>
    </ErpLayout>
  );
}
