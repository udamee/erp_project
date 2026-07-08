"use client";

import { useMemo, useState } from "react";
import { attendanceApi } from "@/lib/api";
import { useAsyncData } from "@/lib/hooks";

const fmt = (d: Date) => d.toLocaleDateString("sv-SE"); // YYYY-MM-DD (local)
const hoursToHM = (h?: number | null) => {
  if (h == null) return "-";
  const min = Math.round(h * 60);
  return `${Math.floor(min / 60)}H ${min % 60}M`;
};

// 상태별 색상·라벨 (근태 테이블과 동일한 코드 체계)
const STATUS_META: Record<string, { label: string; fg: string; bg: string }> = {
  NORMAL: { label: "정상", fg: "var(--erp-primary-dark)", bg: "var(--erp-primary-bg)" },
  LATE: { label: "지각", fg: "var(--erp-warning)", bg: "var(--erp-warning-bg)" },
  EARLY_LEAVE: { label: "조퇴", fg: "#7c3aed", bg: "#f0e9fe" },
  ABSENT: { label: "결근", fg: "var(--erp-danger)", bg: "var(--erp-danger-bg)" },
  LEAVE: { label: "휴가", fg: "var(--erp-info)", bg: "var(--erp-info-bg)" },
};
const STATUS_ORDER = ["NORMAL", "LATE", "EARLY_LEAVE", "ABSENT", "LEAVE"];
// 실제 근무로 집계하는 상태 (근무일 수·평균 근무시간 계산용)
const WORKED = new Set(["NORMAL", "LATE", "EARLY_LEAVE"]);

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default function MyCalendar() {
  // 보고 있는 달의 1일을 기준 커서로 둔다.
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const year = cursor.getFullYear();
  const month = cursor.getMonth(); // 0-based
  const firstDay = useMemo(() => new Date(year, month, 1), [year, month]);
  const lastDay = useMemo(() => new Date(year, month + 1, 0), [year, month]);
  const from = fmt(firstDay);
  const to = fmt(lastDay);

  const listData = useAsyncData(() => attendanceApi.myList(from, to), [from, to]);
  const list = useMemo(() => listData.data ?? [], [listData.data]);
  const loading = listData.loading;
  const error = listData.error;

  // 날짜(YYYY-MM-DD) → 근태 레코드
  const byDate = useMemo(() => {
    const map = new Map<string, (typeof list)[number]>();
    for (const a of list) {
      if (a.workDate) map.set(a.workDate.slice(0, 10), a);
    }
    return map;
  }, [list]);

  // 통계 집계
  const stats = useMemo(() => {
    const counts: Record<string, number> = { NORMAL: 0, LATE: 0, EARLY_LEAVE: 0, ABSENT: 0, LEAVE: 0 };
    let totalHours = 0;
    let hoursDays = 0;
    for (const a of list) {
      if (a.status && counts[a.status] != null) counts[a.status] += 1;
      if (a.workHours != null && a.workHours > 0) {
        totalHours += a.workHours;
        hoursDays += 1;
      }
    }
    const workedDays = STATUS_ORDER.filter((s) => WORKED.has(s)).reduce((n, s) => n + counts[s], 0);
    const avgHours = hoursDays > 0 ? totalHours / hoursDays : null;
    return { counts, totalHours, avgHours, workedDays };
  }, [list]);

  // 달력 셀 구성: 1일 요일만큼 앞을 비우고, 6주(42칸)까지 채운다.
  const cells = useMemo(() => {
    const offset = firstDay.getDay(); // 0=일
    const daysInMonth = lastDay.getDate();
    const total = Math.ceil((offset + daysInMonth) / 7) * 7;
    return Array.from({ length: total }, (_, i) => {
      const dayNum = i - offset + 1;
      if (dayNum < 1 || dayNum > daysInMonth) return null;
      const date = new Date(year, month, dayNum);
      return { dayNum, dateStr: fmt(date), weekday: date.getDay() };
    });
  }, [firstDay, lastDay, year, month]);

  const todayStr = fmt(new Date());

  const shiftMonth = (delta: number) => setCursor(new Date(year, month + delta, 1));
  const goToday = () => {
    const now = new Date();
    setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  return (
    <div style={{ marginTop: 4 }}>
      {/* 월 이동 + 통계 요약 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button className="erp-btn" style={navBtn} onClick={() => shiftMonth(-1)} aria-label="이전 달">‹</button>
          <strong style={{ fontSize: 16, minWidth: 120, textAlign: "center" }}>
            {year}년 {month + 1}월
          </strong>
          <button className="erp-btn" style={navBtn} onClick={() => shiftMonth(1)} aria-label="다음 달">›</button>
          <button className="erp-btn" style={{ marginLeft: 4, height: 32, fontSize: 13 }} onClick={goToday}>오늘</button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div style={statGrid}>
        <StatTile label="근무일" value={`${stats.workedDays}일`} accent="var(--erp-primary-dark)" />
        {STATUS_ORDER.map((s) => (
          <StatTile key={s} label={STATUS_META[s].label} value={`${stats.counts[s]}일`} accent={STATUS_META[s].fg} />
        ))}
        <StatTile label="총 근무시간" value={hoursToHM(stats.totalHours)} accent="var(--erp-text)" />
        <StatTile label="평균 근무시간" value={hoursToHM(stats.avgHours)} accent="var(--erp-text)" />
      </div>

      {error && <p className="erp-warn-text">{error}</p>}

      {/* 달력 */}
      <div className="erp-card" style={{ padding: 0, overflow: "hidden", position: "relative" }}>
        {/* 요일 헤더 */}
        <div style={weekHeader}>
          {WEEKDAYS.map((w, i) => (
            <div
              key={w}
              style={{
                ...weekHeaderCell,
                color: i === 0 ? "var(--erp-danger)" : i === 6 ? "var(--erp-info)" : "var(--erp-text-muted)",
              }}
            >
              {w}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div style={grid}>
          {cells.map((cell, i) => {
            if (!cell) return <div key={`e${i}`} style={{ ...dayCell, background: "var(--erp-bg)" }} />;
            const rec = byDate.get(cell.dateStr);
            const meta = rec?.status ? STATUS_META[rec.status] : null;
            const isToday = cell.dateStr === todayStr;
            const dayColor =
              cell.weekday === 0 ? "var(--erp-danger)" : cell.weekday === 6 ? "var(--erp-info)" : "var(--erp-text)";
            return (
              <div key={cell.dateStr} style={{ ...dayCell, ...(isToday ? todayCell : null) }}>
                <span style={{ fontSize: 13, fontWeight: isToday ? 700 : 500, color: dayColor }}>{cell.dayNum}</span>
                {meta && (
                  <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 3 }}>
                    <span style={{ ...pill, color: meta.fg, background: meta.bg }}>{meta.label}</span>
                    {rec?.workHours != null && rec.workHours > 0 && (
                      <span style={{ fontSize: 11, color: "var(--erp-text-muted)" }}>{hoursToHM(rec.workHours)}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {loading && (
          <div style={loadingOverlay}>불러오는 중...</div>
        )}
      </div>

      {/* 범례 */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 10 }}>
        {STATUS_ORDER.map((s) => (
          <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--erp-text-muted)" }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: STATUS_META[s].fg, display: "inline-block" }} />
            {STATUS_META[s].label}
          </span>
        ))}
      </div>
    </div>
  );
}

function StatTile({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="erp-card" style={{ padding: "12px 14px" }}>
      <p style={{ margin: 0, fontSize: 12, color: "var(--erp-text-muted)" }}>{label}</p>
      <strong style={{ fontSize: 18, color: accent }}>{value}</strong>
    </div>
  );
}

const navBtn: React.CSSProperties = { height: 32, width: 32, fontSize: 18, lineHeight: 1, padding: 0 };

const statGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
  gap: 10,
  marginBottom: 14,
};

const weekHeader: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  borderBottom: "1px solid var(--erp-line)",
};
const weekHeaderCell: React.CSSProperties = {
  padding: "10px 0",
  textAlign: "center",
  fontSize: 12,
  fontWeight: 600,
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
};
const dayCell: React.CSSProperties = {
  minHeight: 92,
  padding: 8,
  borderRight: "1px solid var(--erp-line)",
  borderBottom: "1px solid var(--erp-line)",
  display: "flex",
  flexDirection: "column",
};
const todayCell: React.CSSProperties = {
  boxShadow: "inset 0 0 0 2px var(--erp-primary)",
  background: "var(--erp-primary-soft)",
};
const pill: React.CSSProperties = {
  alignSelf: "flex-start",
  fontSize: 11,
  fontWeight: 600,
  padding: "1px 8px",
  borderRadius: 10,
};
const loadingOverlay: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(255,255,255,0.6)",
  color: "var(--erp-text-muted)",
  fontSize: 14,
};
