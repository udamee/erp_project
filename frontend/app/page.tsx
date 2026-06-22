"use client";

import { useCallback, useEffect, useMemo, useState, type ComponentType, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { SafetyCertificateOutlined, CrownOutlined, UserOutlined } from "@ant-design/icons";
import ErpLayout from "@/components/ErpLayout";
import { roleLabel } from "@/components/EmployeeStatusBadge";
import {
  adminEmployeeApi,
  attendanceApi,
  departmentApi,
  employeeApi,
  userStorage,
  type Attendance,
  type Employee,
} from "@/lib/api";

const timeOnly = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) : "-";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// 출근 상태 배지 메타
const STATUS_META: Record<string, { label: string; bg: string; fg: string }> = {
  NORMAL: { label: "출근", bg: "var(--erp-primary-bg)", fg: "var(--erp-primary-dark)" },
  LATE: { label: "지각", bg: "var(--erp-warning-bg)", fg: "var(--erp-warning)" },
  EARLY_LEAVE: { label: "조퇴", bg: "var(--erp-warning-bg)", fg: "var(--erp-warning)" },
  ABSENT: { label: "결근", bg: "var(--erp-danger-bg)", fg: "var(--erp-danger)" },
};

type Alert = { tone: "warn" | "info" | "ok"; text: string; href?: string };

export default function HomePage() {
  const router = useRouter();
  const cached = typeof window !== "undefined" ? userStorage.get() : null;

  const [me, setMe] = useState<Employee | null>(null);
  const [deptCode, setDeptCode] = useState<string | null>(null);
  const [today, setToday] = useState<Attendance | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [busy, setBusy] = useState(false);

  const isAdmin = (me?.roleCode ?? cached?.role) === "ADMIN";
  const isHR = deptCode === "DEPT_HR" || isAdmin;

  const loadToday = useCallback(() => {
    attendanceApi.today().then(setToday).catch(() => setToday(null));
  }, []);

  useEffect(() => {
    Promise.all([employeeApi.me(), departmentApi.list()])
      .then(([info, depts]) => {
        setMe(info);
        setDeptCode(depts.find((d) => d.deptId === info.deptId)?.deptCode ?? null);
      })
      .catch(() => {});
  }, []);

  useEffect(() => { loadToday(); }, [loadToday]);

  useEffect(() => {
    if (!isHR) return;
    adminEmployeeApi.pending().then((list) => setPendingCount(list.length)).catch(() => {});
  }, [isHR]);

  const checkedIn = !!today?.checkIn;
  const checkedOut = !!today?.checkOut;

  const handleCheckIn = async () => {
    setBusy(true);
    try { await attendanceApi.checkIn(); loadToday(); }
    catch (e) { alert((e as Error).message); }
    finally { setBusy(false); }
  };

  const handleCheckOut = async () => {
    setBusy(true);
    try { await attendanceApi.checkOut(); loadToday(); }
    catch (e) { alert((e as Error).message); }
    finally { setBusy(false); }
  };

  // ===== 파생 값 =====
  const displayName = me?.empName ?? cached?.empName ?? "사용자";
  const roleText = roleLabel(me?.roleCode ?? cached?.role ?? "");
  const empNo = me ? String(me.empId).padStart(4, "0") : "-";

  // 역할별 인사말 아이콘·색상 (배지 없이 글자색만)
  const role = me?.roleCode ?? cached?.role ?? "STAFF";
  const ROLE_META: Record<string, { color: string; Icon: ComponentType }> = {
    ADMIN: { color: "#e0820c", Icon: SafetyCertificateOutlined },
    MANAGER: { color: "#185fa5", Icon: CrownOutlined },
    STAFF: { color: "#1d9e75", Icon: UserOutlined },
  };
  const rm = ROLE_META[role] ?? ROLE_META.STAFF;
  const RoleIcon = rm.Icon;

  // 오늘 날짜
  const now = new Date();
  const todayLongStr = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일 ${WEEKDAYS[now.getDay()]}요일`;

  // 오늘 근무 시간(분) — 출근~퇴근, 퇴근 전이면 현재까지
  let todayMinutes = 0;
  if (today?.checkIn) {
    const start = new Date(today.checkIn).getTime();
    const end = today.checkOut ? new Date(today.checkOut).getTime() : Date.now();
    todayMinutes = Math.max(0, Math.floor((end - start) / 60000));
  }
  const todayKorHM = `${Math.floor(todayMinutes / 60)}시간 ${todayMinutes % 60}분`;

  // 출근 상태 배지
  const statusMeta = checkedIn
    ? (STATUS_META[today?.status ?? ""] ?? { label: today?.status ?? "-", bg: "var(--erp-bg)", fg: "var(--erp-text-muted)" })
    : { label: "미출근", bg: "var(--erp-bg)", fg: "var(--erp-text-muted)" };

  // 알림 (기존 데이터 파생)
  const alerts: Alert[] = useMemo(() => {
    const list: Alert[] = [];
    if (!checkedIn) list.push({ tone: "warn", text: "아직 출근 기록이 없어요." });
    else if (!checkedOut) list.push({ tone: "info", text: "퇴근 기록이 없어요. 퇴근 시 체크해 주세요." });
    if (isHR && pendingCount > 0)
      list.push({ tone: "info", text: `가입 승인 대기 직원 ${pendingCount}명`, href: "/employees" });
    if (list.length === 0) list.push({ tone: "ok", text: "처리할 일이 없습니다 🎉" });
    return list;
  }, [checkedIn, checkedOut, isHR, pendingCount]);

  const quickLinks = useMemo(() => {
    const links = [{ href: "/attendance", label: "근태 관리" }];
    if (isHR) links.push({ href: "/employees", label: "직원 관리" });
    if (deptCode === "DEPT_LOG" || isAdmin) links.push({ href: "/purchase-orders", label: "발주 / 입고" });
    return links;
  }, [isHR, isAdmin, deptCode]);

  const toneColor: Record<Alert["tone"], { bg: string; fg: string }> = {
    warn: { bg: "var(--erp-warning-bg)", fg: "var(--erp-warning)" },
    info: { bg: "var(--erp-info-bg)", fg: "var(--erp-info)" },
    ok: { bg: "var(--erp-primary-bg)", fg: "var(--erp-primary-dark)" },
  };

  // 작고 회색 글자 / 라벨 배지 / 행
  const subtle: CSSProperties = { fontSize: 14, color: "var(--erp-text-muted)" };
  const labelText: CSSProperties = { width: 72, flexShrink: 0, color: "var(--erp-text-muted)" };
  const vline: CSSProperties = { width: 1, height: 14, background: "var(--erp-line)", display: "inline-block", flexShrink: 0 };
  const infoRow: CSSProperties = { display: "flex", alignItems: "center", gap: 10 };
  const statusBadge: CSSProperties = {
    background: statusMeta.bg, color: statusMeta.fg,
    fontSize: 13, fontWeight: 600, padding: "2px 10px", borderRadius: 999,
  };

  return (
    <ErpLayout title="홈">
      {/* 인사말 (중앙, 강조) */}
      <div style={{ textAlign: "center", padding: "12px 0 8px" }}>
        <h2 style={{ margin: 0, fontSize: 25, fontWeight: 700 }}>
          안녕하세요,{" "}
          <span style={{ color: rm.color }}>
            <RoleIcon /> {roleText}
          </span>{" "}
          {displayName}님!
        </h2>
        <p style={{ margin: "10px 0 0" }}>
          <span style={subtle}>오늘은 </span>
          <span style={{ fontSize: 25, fontWeight: 700 }}>{todayLongStr}</span>
          <span style={subtle}> 입니다.</span>
        </p>
      </div>

      {/* 오늘 요약: 좌(프로필/상태) · 우(출퇴근) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
        {/* 좌측 박스 — 프로필/상태 */}
        <div className="erp-card" style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 14, fontSize: 16, fontWeight: 400, minHeight: 168 }}>
          <div style={infoRow}><span style={labelText}>사원번호</span><span style={vline} /><span>{empNo}</span></div>
          <div style={infoRow}><span style={labelText}>이름</span><span style={vline} /><span>{displayName}</span></div>
          <div style={infoRow}><span style={labelText}>부서</span><span style={vline} /><span>{me?.deptName ?? "-"}</span></div>
          <div style={infoRow}>
            <span style={labelText}>근무 상태</span><span style={vline} />
            <span style={statusBadge}>{statusMeta.label}</span>
          </div>
        </div>

        {/* 우측 박스 — 출퇴근 */}
        <div className="erp-card" style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 16, minHeight: 168 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              className="erp-btn primary"
              onClick={handleCheckIn}
              disabled={busy || checkedIn}
              style={{ height: 60, minWidth: 124, fontSize: 17, fontWeight: 700, opacity: checkedIn ? 1 : undefined }}
            >
              {checkedIn ? timeOnly(today?.checkIn ?? null) : "출근"}
            </button>
            <button
              className="erp-btn"
              onClick={handleCheckOut}
              disabled={busy || !checkedIn || checkedOut}
              style={{ height: 60, minWidth: 124, fontSize: 17, fontWeight: 700, opacity: checkedOut ? 1 : undefined }}
            >
              {checkedOut ? timeOnly(today?.checkOut ?? null) : "퇴근"}
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 14, color: "var(--erp-text-muted)" }}>오늘 총 업무 시간</span>
            <span style={{ width: 1, height: 14, background: "var(--erp-line)", display: "inline-block" }} />
            <span style={{ fontSize: 16, fontWeight: 700 }}>{todayKorHM}</span>
          </div>
        </div>
      </div>

      {/* 내 할 일 / 알림 */}
      <div className="erp-card" style={{ marginTop: 12 }}>
        <p style={{ marginTop: 0 }}>내 할 일 / 알림</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
          {alerts.map((a, i) => (
            <div
              key={i}
              onClick={() => a.href && router.push(a.href)}
              style={{
                background: toneColor[a.tone].bg, color: toneColor[a.tone].fg,
                padding: "10px 12px", borderRadius: 8, fontSize: 13,
                display: "flex", justifyContent: "space-between", alignItems: "center",
                cursor: a.href ? "pointer" : "default",
              }}
            >
              <span>{a.text}</span>
              {a.href && <span style={{ fontSize: 12, fontWeight: 600 }}>확인 →</span>}
            </div>
          ))}
        </div>
      </div>

      {/* 빠른 메뉴 */}
      <div className="erp-card" style={{ marginTop: 12 }}>
        <p style={{ marginTop: 0 }}>빠른 메뉴</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          {quickLinks.map((l) => (
            <button key={l.href} className="erp-btn" onClick={() => router.push(l.href)}>
              {l.label}
            </button>
          ))}
        </div>
      </div>
    </ErpLayout>
  );
}
