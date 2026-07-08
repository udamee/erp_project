"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircleOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  MedicineBoxOutlined,
  CarOutlined,
  ShoppingOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import ErpLayout from "@/components/ErpLayout";
import {
  adminAttendanceApi,
  adminEmployeeApi,
  employeeApi,
  salesOrderApi,
  shipmentApi,
  type Employee,
  type Shipment,
} from "@/lib/api";
import { userStorage } from "@/lib/api-client";

// 통계 카드
function StatCard({
  label, value, accent, hint, onClick,
}: { label: string; value: React.ReactNode; accent?: boolean; hint?: string; onClick?: () => void }) {
  return (
    <button
      className="erp-card"
      onClick={onClick}
      style={{
        flex: 1,
        minWidth: 180,
        textAlign: "left",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <p style={{ margin: 0, fontSize: 13, color: "var(--erp-text-muted)" }}>{label}</p>
      <strong style={{ fontSize: 26, color: accent ? "var(--erp-danger)" : "var(--erp-text)" }}>
        {value}
      </strong>
      {hint && <span style={{ display: "block", marginTop: 4, fontSize: 12, color: "var(--erp-text-muted)" }}>{hint}</span>}
    </button>
  );
}

function formatDate(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function MiniMetric({ label, value, danger }: { label: string; value: React.ReactNode; danger?: boolean }) {
  return (
    <div
      style={{
        minHeight: 74,
        padding: "12px 14px",
        border: "1px solid var(--erp-line)",
        borderRadius: 8,
        background: "var(--erp-bg)",
      }}
    >
      <div style={{ fontSize: 12, color: "var(--erp-text-muted)", fontWeight: 700 }}>{label}</div>
      <strong style={{ display: "block", marginTop: 6, fontSize: 22, color: danger ? "var(--erp-danger)" : "var(--erp-text)" }}>
        {value}
      </strong>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const cached = typeof window !== "undefined" ? userStorage.get() : null;

  const [me, setMe] = useState<Employee | null>(null);
  const [pending, setPending] = useState<Employee[]>([]);
  const [activeCount, setActiveCount] = useState<number | null>(null);
  const [todayAttendanceCount, setTodayAttendanceCount] = useState<number | null>(null);
  const [missingCheckoutCount, setMissingCheckoutCount] = useState<number | null>(null);
  const [shipmentCounts, setShipmentCounts] = useState<Record<string, number>>({});
  const [salesOrderCounts, setSalesOrderCounts] = useState<Record<string, number>>({});
  const [recentShipments, setRecentShipments] = useState<Shipment[]>([]);
  const [busy, setBusy] = useState(false);

  const role = me?.roleCode ?? cached?.role ?? "STAFF";
  const isAdmin = role === "ADMIN";
  const isManager = role === "MANAGER" || isAdmin;
  // 직원 관리 권한은 인사부 매니저 + 관리자 (백엔드 권한 기준과 일치)
  const isHR = isAdmin || (role === "MANAGER" && cached?.deptCode === "DEPT_HR");
  const canAccess = isManager;

  useEffect(() => {
    employeeApi.me()
      .then(setMe)
      .catch(() => {});
  }, []);

  const loadHr = useCallback(() => {
    if (!isHR) return;
    adminEmployeeApi.pending().then(setPending).catch(() => {});
    employeeApi.list().then((l) => setActiveCount(l.length)).catch(() => {});
  }, [isHR]);

  useEffect(loadHr, [loadHr]);

  useEffect(() => {
    if (!isManager) return;

    const today = formatDate(new Date());

    adminAttendanceApi.search({ from: today, to: today })
      .then((rows) => {
        setTodayAttendanceCount(rows.length);
        setMissingCheckoutCount(rows.filter((row) => row.checkIn && !row.checkOut).length);
      })
      .catch(() => {
        setTodayAttendanceCount(null);
        setMissingCheckoutCount(null);
      });

    salesOrderApi.statusCount().then(setSalesOrderCounts).catch(() => {});
    shipmentApi.statusCount().then(setShipmentCounts).catch(() => {});
    shipmentApi.listPaging(1, 5, "SHIPPED")
      .then((res) => setRecentShipments(res.list))
      .catch(() => setRecentShipments([]));
  }, [isManager]);

  const handle = async (fn: () => Promise<void>, confirmMsg: string) => {
    if (!confirm(confirmMsg)) return;
    setBusy(true);
    try {
      await fn();
      loadHr();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const links = useMemo(() => {
    const arr: { href: string; label: string; desc: string; Icon: React.ComponentType }[] = [];
    if (isHR)
      arr.push({ href: "/employees", label: "직원 관리", desc: "직원 조회·승인·역할·계정 관리", Icon: TeamOutlined });
    if (isManager) {
      arr.push({ href: "/attendance", label: "근태 관리", desc: "전체 근태 조회·보정·결근/휴가 등록", Icon: ClockCircleOutlined });
      arr.push({ href: "/shipments", label: "출고 관리", desc: "출고 완료·취소 내역과 담당자 확인", Icon: CarOutlined });
      arr.push({ href: "/sales-orders", label: "주문 관리", desc: "승인 대기·출고 대기 주문 확인", Icon: ShoppingOutlined });
    }
    arr.push({ href: "/product", label: "상품 관리", desc: "상품 마스터 조회·동기화", Icon: MedicineBoxOutlined });
    return arr;
  }, [isHR, isManager]);

  if (!canAccess) {
    return (
      <ErpLayout title="관리자">
        <div className="erp-card" style={{ textAlign: "center", padding: 48 }}>
          <SafetyCertificateOutlined style={{ fontSize: 40, color: "var(--erp-text-muted)" }} />
          <h3 style={{ margin: "12px 0 4px" }}>관리자 전용 페이지입니다</h3>
          <p style={{ margin: 0, color: "var(--erp-text-muted)" }}>
            이 페이지는 관리자·매니저 또는 인사팀만 접근할 수 있습니다.
          </p>
        </div>
      </ErpLayout>
    );
  }

  return (
    <ErpLayout title="관리자">
      {/* 헤더 배너 */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", marginBottom: 12,
        background: "var(--erp-primary-bg)", borderRadius: 10,
      }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700,
          color: "#fff", background: "var(--erp-primary)", padding: "3px 10px", borderRadius: 6,
        }}>
          <SafetyCertificateOutlined /> 관리자 콘솔
        </span>
        <span style={{ fontSize: 13, color: "var(--erp-primary-dark)" }}>
          직원·근태·출고 운영 상태를 한 곳에서 확인하고 처리합니다.
        </span>
      </div>

      {/* 통계 */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {isHR && (
          <StatCard
            label="가입 승인 대기"
            value={`${pending.length}명`}
            accent={pending.length > 0}
            onClick={() => router.push("/employees")}
          />
        )}
        {isHR && <StatCard label="재직 직원" value={activeCount != null ? `${activeCount}명` : "-"} />}
        <StatCard
          label="출고 대기 주문"
          value={`${salesOrderCounts.APPROVED ?? 0}건`}
          accent={(salesOrderCounts.APPROVED ?? 0) > 0}
          hint="승인 완료 후 출고 처리 필요"
          onClick={() => router.push("/sales-orders")}
        />
        <StatCard
          label="오늘 근태 기록"
          value={todayAttendanceCount != null ? `${todayAttendanceCount}건` : "-"}
          hint={missingCheckoutCount ? `퇴근 미처리 ${missingCheckoutCount}건` : "관리자 근태 기준"}
          accent={(missingCheckoutCount ?? 0) > 0}
          onClick={() => router.push("/attendance")}
        />
        <StatCard label="내 권한" value={isAdmin ? "관리자" : isManager ? "매니저" : "인사팀"} />
      </div>

      {/* 운영 현황 */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 12, marginTop: 12 }}>
        <div className="erp-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>
              <CarOutlined /> 출고 현황
            </span>
            <button className="erp-btn" style={{ height: 30 }} onClick={() => router.push("/shipments")}>
              출고 관리로 이동
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
            <MiniMetric label="출고 대기 주문" value={`${salesOrderCounts.APPROVED ?? 0}건`} danger={(salesOrderCounts.APPROVED ?? 0) > 0} />
            <MiniMetric label="출고 완료" value={`${shipmentCounts.SHIPPED ?? 0}건`} />
            <MiniMetric label="출고 취소" value={`${shipmentCounts.CANCELED ?? 0}건`} danger={(shipmentCounts.CANCELED ?? 0) > 0} />
          </div>
          <div style={{ marginTop: 14 }}>
            <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 700 }}>최근 출고</div>
            {recentShipments.length === 0 ? (
              <p style={{ margin: 0, color: "var(--erp-text-muted)", fontSize: 13 }}>최근 출고 내역이 없습니다.</p>
            ) : (
              <div style={{ display: "grid", gap: 6 }}>
                {recentShipments.map((shipment) => (
                  <button
                    key={shipment.shipmentId}
                    className="erp-btn"
                    style={{ justifyContent: "space-between", width: "100%", height: 38 }}
                    onClick={() => router.push(`/shipments/${shipment.shipmentId}`)}
                  >
                    <span>SH-{String(shipment.shipmentId).padStart(4, "0")} / SO-{String(shipment.soId).padStart(4, "0")}</span>
                    <span style={{ color: "var(--erp-text-muted)" }}>{shipment.employeeName} · {shipment.shipmentDate?.slice(0, 10) ?? "-"}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="erp-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>
              <ClockCircleOutlined /> 인사·근태 현황
            </span>
            <button className="erp-btn" style={{ height: 30 }} onClick={() => router.push("/attendance")}>
              근태 관리로 이동
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
            <MiniMetric label="오늘 근태" value={todayAttendanceCount != null ? `${todayAttendanceCount}건` : "-"} />
            <MiniMetric label="퇴근 미처리" value={missingCheckoutCount != null ? `${missingCheckoutCount}건` : "-"} danger={(missingCheckoutCount ?? 0) > 0} />
            <MiniMetric label="가입 승인 대기" value={isHR ? `${pending.length}명` : "-"} danger={isHR && pending.length > 0} />
          </div>
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8, color: "var(--erp-text-muted)", fontSize: 13 }}>
            {(missingCheckoutCount ?? 0) > 0 ? <WarningOutlined style={{ color: "var(--erp-danger)" }} /> : <CheckCircleOutlined style={{ color: "var(--erp-primary-dark)" }} />}
            <span>
              {(missingCheckoutCount ?? 0) > 0
                ? "퇴근 미처리 기록이 있어 근태 보정 확인이 필요합니다."
                : "현재 확인된 퇴근 미처리 근태가 없습니다."}
            </span>
          </div>
        </div>
      </div>

      {/* 가입 승인 대기 (HR·ADMIN) */}
      {isHR && (
        <div className="erp-card" style={{ marginTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>가입 승인 대기</span>
            <button className="erp-btn" style={{ height: 30 }} onClick={() => router.push("/employees")}>
              직원 관리로 이동
            </button>
          </div>
          <div className="erp-table-wrap">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>사번</th><th>아이디</th><th>이름</th><th>부서</th><th>이메일</th>
                  <th style={{ textAlign: "right" }}>처리</th>
                </tr>
              </thead>
              <tbody>
                {pending.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: 32 }}>승인 대기 중인 직원이 없습니다.</td></tr>
                ) : (
                  pending.map((e) => (
                    <tr key={e.empId} style={{ cursor: "default" }}>
                      <td>{String(e.empId).padStart(4, "0")}</td>
                      <td>{e.loginId}</td>
                      <td>{e.empName}</td>
                      <td>{e.deptName ?? "-"}</td>
                      <td>{e.email ?? "-"}</td>
                      <td style={{ textAlign: "right" }}>
                        <button className="erp-btn primary" style={{ height: 30, marginRight: 6 }} disabled={busy}
                          onClick={() => handle(() => adminEmployeeApi.approve(e.empId), "이 직원의 가입을 승인하시겠습니까?")}>
                          승인
                        </button>
                        <button className="erp-btn danger-outline" style={{ height: 30 }} disabled={busy}
                          onClick={() => handle(() => adminEmployeeApi.reject(e.empId), "이 직원의 가입을 거절하시겠습니까?")}>
                          거절
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 빠른 메뉴 */}
      <div className="erp-card" style={{ marginTop: 12 }}>
        <p style={{ marginTop: 0, fontSize: 14, fontWeight: 600 }}>관리 메뉴</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, marginTop: 8 }}>
          {links.map(({ href, label, desc, Icon }) => (
            <button
              key={href}
              onClick={() => router.push(href)}
              className="erp-card"
              style={{
                textAlign: "left", cursor: "pointer", border: "1px solid var(--erp-line)",
                display: "flex", gap: 12, alignItems: "center", padding: 14,
              }}
            >
              <span style={{
                width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                background: "var(--erp-primary-bg)", color: "var(--erp-primary-dark)",
                display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 18,
              }}>
                <Icon />
              </span>
              <span>
                <span style={{ display: "block", fontWeight: 600, fontSize: 14 }}>{label}</span>
                <span style={{ display: "block", fontSize: 12, color: "var(--erp-text-muted)", marginTop: 2 }}>{desc}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </ErpLayout>
  );
}
