"use client";

import { useState } from "react";
import { attendanceApi } from "@/lib/api";
import { useAsyncData } from "@/lib/hooks";

const fmt = (d: Date) => d.toLocaleDateString("sv-SE");
const timeOnly = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) : "-";

const STATUS_LABEL: Record<string, string> = {
  NORMAL: "정상", LATE: "지각", EARLY_LEAVE: "조퇴", ABSENT: "결근", LEAVE: "휴가",
};
const statusText = (s?: string | null) => (s ? STATUS_LABEL[s] ?? s : "-");
const hoursToHM = (h?: number | null) => {
  const min = Math.round((h ?? 0) * 60);
  return `${Math.floor(min / 60)}H ${min % 60}M`;
};

export default function MyAttendance() {
  const [from, setFrom] = useState(() => {
    const d = new Date();
    return fmt(new Date(d.getFullYear(), d.getMonth(), 1));
  });
  const [to, setTo] = useState(() => fmt(new Date()));
  const [busy, setBusy] = useState(false);

  // 오늘 출퇴근(today)과 기간 목록(myList)을 각각 경쟁상태-안전하게 로드
  const todayData = useAsyncData(() => attendanceApi.today(), []);
  const listData = useAsyncData(() => attendanceApi.myList(from, to), [from, to]);

  const todayRec = todayData.data;
  const list = listData.data ?? [];
  const loading = listData.loading;
  const error = listData.error;

  const refresh = () => { todayData.reload(); listData.reload(); };

  const handleCheckIn = async () => {
    setBusy(true);
    try { await attendanceApi.checkIn(); refresh(); }
    catch (e) { alert((e as Error).message); }
    finally { setBusy(false); }
  };

  const handleCheckOut = async () => {
    setBusy(true);
    try { await attendanceApi.checkOut(); refresh(); }
    catch (e) { alert((e as Error).message); }
    finally { setBusy(false); }
  };

  const checkedIn = !!todayRec?.checkIn;
  const checkedOut = !!todayRec?.checkOut;

  return (
    <>
      {/* 오늘 출퇴근 */}
      <div className="erp-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 32 }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: "var(--erp-text-muted)" }}>오늘 출근</p>
            <strong style={{ fontSize: 16 }}>{timeOnly(todayRec?.checkIn ?? null)}</strong>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: "var(--erp-text-muted)" }}>오늘 퇴근</p>
            <strong style={{ fontSize: 16 }}>{timeOnly(todayRec?.checkOut ?? null)}</strong>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="erp-btn primary" disabled={busy || checkedIn} onClick={handleCheckIn}>출근</button>
          <button className="erp-btn" disabled={busy || !checkedIn || checkedOut} onClick={handleCheckOut}>퇴근</button>
        </div>
      </div>

      {/* 기간 조회 */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
        <input type="date" className="erp-input" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
        <span style={{ color: "var(--erp-text-muted)" }}>~</span>
        <input type="date" className="erp-input" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
        <button className="erp-btn" onClick={listData.reload}>조회</button>
      </div>

      {error && <p className="erp-warn-text">{error}</p>}

      {/* 조회 기간 총 근무 시간 */}
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, fontSize: 13 }}>
        <span style={{ color: "var(--erp-text-muted)" }}>조회 기간 총 근무 시간</span>
        <span style={{ width: 1, height: 12, background: "var(--erp-line)", display: "inline-block" }} />
        <strong>{hoursToHM(list.reduce((s, a) => s + (a.workHours ?? 0), 0))}</strong>
      </div>

      {/* 근태 목록 */}
      <div className="erp-table-wrap">
        <table className="erp-table">
          <thead>
            <tr>
              <th>날짜</th><th>출근 상태</th><th>출근 시간</th><th>퇴근 시간</th><th className="num">하루 근무 시간</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: 40 }}>불러오는 중...</td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: 40 }}>근태 기록이 없습니다.</td></tr>
            ) : (
              list.map((a) => (
                <tr key={a.attendanceId} style={{ cursor: "default" }}>
                  <td>{a.workDate?.slice(0, 10)}</td>
                  <td>{statusText(a.status)}</td>
                  <td>{timeOnly(a.checkIn)}</td>
                  <td>{timeOnly(a.checkOut)}</td>
                  <td className="num">{a.workHours != null ? hoursToHM(a.workHours) : "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
