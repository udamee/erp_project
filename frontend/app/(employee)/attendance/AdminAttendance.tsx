"use client";

import { useEffect, useState } from "react";
import {
  adminAttendanceApi,
  departmentApi,
  type Attendance,
  type Department,
} from "@/lib/api";
import { useAsyncData } from "@/lib/hooks";

const fmt = (d: Date) => d.toLocaleDateString("sv-SE");
const timeOnly = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) : "-";
const toLocalInput = (iso: string | null) => (iso ? iso.slice(0, 16) : "");
const hoursToHM = (h?: number | null) => {
  if (h == null) return "-";
  const min = Math.round(h * 60);
  return `${Math.floor(min / 60)}H ${min % 60}M`;
};

const STATUS_LABEL: Record<string, string> = {
  NORMAL: "정상", LATE: "지각", EARLY_LEAVE: "조퇴", ABSENT: "결근", LEAVE: "휴가",
};
const statusText = (s?: string | null) => (s ? STATUS_LABEL[s] ?? s : "-");
const STATUS_OPTIONS = ["NORMAL", "LATE", "EARLY_LEAVE", "ABSENT", "LEAVE"];

export default function AdminAttendance({
  absenceOpen,
  onAbsenceClose,
}: {
  absenceOpen: boolean;
  onAbsenceClose: () => void;
}) {
  const [depts, setDepts] = useState<Department[]>([]);

  const [deptId, setDeptId] = useState("");
  const [empId, setEmpId] = useState("");
  const [from, setFrom] = useState(() => {
    const d = new Date();
    return fmt(new Date(d.getFullYear(), d.getMonth(), 1));
  });
  const [to, setTo] = useState(() => fmt(new Date()));
  const [status, setStatus] = useState("");

  const [editing, setEditing] = useState<Attendance | null>(null);
  const [editForm, setEditForm] = useState({ checkIn: "", checkOut: "", status: "", memo: "" });

  const [absence, setAbsence] = useState(() => ({ empId: "", workDate: fmt(new Date()), status: "ABSENT", memo: "" }));

  const [busy, setBusy] = useState(false);

  useEffect(() => {
    departmentApi.list().then(setDepts).catch(() => {});
  }, []);

  // 검색 조건이 바뀔 때마다 경쟁상태-안전하게 재조회
  const listData = useAsyncData(
    () => adminAttendanceApi.search({
      deptId: deptId ? Number(deptId) : undefined,
      empId: empId ? Number(empId) : undefined,
      from,
      to,
      status: status || undefined,
    }),
    [deptId, empId, from, to, status],
  );
  const list = listData.data ?? [];
  const loading = listData.loading;
  const error = listData.error;

  const openEdit = (a: Attendance) => {
    setEditing(a);
    setEditForm({
      checkIn: toLocalInput(a.checkIn),
      checkOut: toLocalInput(a.checkOut),
      status: a.status ?? "NORMAL",
      memo: a.memo ?? "",
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      await adminAttendanceApi.update(editing.attendanceId, {
        checkIn: editForm.checkIn || undefined,
        checkOut: editForm.checkOut || undefined,
        status: editForm.status,
        memo: editForm.memo,
      });
      setEditing(null);
      listData.reload();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const saveAbsence = async () => {
    if (!absence.empId) { alert("사번을 입력해주세요."); return; }
    setBusy(true);
    try {
      await adminAttendanceApi.createAbsence({
        empId: Number(absence.empId),
        workDate: absence.workDate,
        status: absence.status as "ABSENT" | "LEAVE",
        memo: absence.memo || undefined,
      });
      onAbsenceClose();
      setAbsence({ empId: "", workDate: fmt(new Date()), status: "ABSENT", memo: "" });
      listData.reload();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {/* 검색 */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <select className="erp-select" value={deptId} onChange={(e) => setDeptId(e.target.value)}>
          <option value="">전체 부서</option>
          {depts.map((d) => <option key={d.deptId} value={d.deptId}>{d.deptName}</option>)}
        </select>
        <input className="erp-input" style={{ width: 110 }} placeholder="사번" value={empId}
          onChange={(e) => setEmpId(e.target.value.replace(/\D/g, ""))} />
        <input type="date" className="erp-input" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
        <span style={{ color: "var(--erp-text-muted)" }}>~</span>
        <input type="date" className="erp-input" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
        <select className="erp-select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">전체 상태</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
        <button className="erp-btn" onClick={listData.reload}>조회</button>
      </div>

      {error && <p className="erp-warn-text">{error}</p>}

      {/* 근태 테이블 */}
      <div className="erp-table-wrap">
        <table className="erp-table">
          <thead>
            <tr>
              <th>날짜</th><th>사번</th><th>직원</th><th>부서</th><th>출근</th><th>퇴근</th><th className="num">근무시간</th><th>상태</th><th>메모</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: "center", padding: 40 }}>불러오는 중...</td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: "center", padding: 40 }}>근태 기록이 없습니다.</td></tr>
            ) : (
              list.map((a) => (
                <tr key={a.attendanceId} onClick={() => openEdit(a)}>
                  <td>{a.workDate?.slice(0, 10)}</td>
                  <td>{String(a.empId).padStart(4, "0")}</td>
                  <td>{a.empName}</td>
                  <td>{a.deptName ?? "-"}</td>
                  <td>{timeOnly(a.checkIn)}</td>
                  <td>{timeOnly(a.checkOut)}</td>
                  <td className="num">{hoursToHM(a.workHours)}</td>
                  <td>{statusText(a.status)}</td>
                  <td>{a.memo ?? "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 근태 보정 모달 */}
      {editing && (
        <div onClick={() => setEditing(null)} style={overlay}>
          <div onClick={(e) => e.stopPropagation()} className="erp-card" style={modal}>
            <h3 style={{ margin: "0 0 4px", fontSize: 16 }}>근태 보정</h3>
            <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--erp-text-muted)" }}>
              {editing.empName} · {editing.workDate?.slice(0, 10)}
            </p>
            <label style={field}><span>출근</span>
              <input type="datetime-local" className="erp-input" value={editForm.checkIn}
                onChange={(e) => setEditForm((f) => ({ ...f, checkIn: e.target.value }))} /></label>
            <label style={field}><span>퇴근</span>
              <input type="datetime-local" className="erp-input" value={editForm.checkOut}
                onChange={(e) => setEditForm((f) => ({ ...f, checkOut: e.target.value }))} /></label>
            <label style={field}><span>상태</span>
              <select className="erp-select" value={editForm.status}
                onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select></label>
            <label style={field}><span>메모</span>
              <input className="erp-input" value={editForm.memo}
                onChange={(e) => setEditForm((f) => ({ ...f, memo: e.target.value }))} /></label>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
              <button className="erp-btn" onClick={() => setEditing(null)} disabled={busy}>취소</button>
              <button className="erp-btn primary" onClick={saveEdit} disabled={busy}>저장</button>
            </div>
          </div>
        </div>
      )}

      {/* 결근/휴가 등록 모달 */}
      {absenceOpen && (
        <div onClick={onAbsenceClose} style={overlay}>
          <div onClick={(e) => e.stopPropagation()} className="erp-card" style={modal}>
            <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>결근 / 휴가 등록</h3>
            <label style={field}><span>사번</span>
              <input className="erp-input" placeholder="사번(숫자)" value={absence.empId}
                onChange={(e) => setAbsence((v) => ({ ...v, empId: e.target.value.replace(/\D/g, "") }))} /></label>
            <label style={field}><span>날짜</span>
              <input type="date" className="erp-input" value={absence.workDate}
                onChange={(e) => setAbsence((v) => ({ ...v, workDate: e.target.value }))} /></label>
            <label style={field}><span>구분</span>
              <select className="erp-select" value={absence.status}
                onChange={(e) => setAbsence((v) => ({ ...v, status: e.target.value }))}>
                <option value="ABSENT">결근</option>
                <option value="LEAVE">휴가</option>
              </select></label>
            <label style={field}><span>메모</span>
              <input className="erp-input" value={absence.memo}
                onChange={(e) => setAbsence((v) => ({ ...v, memo: e.target.value }))} /></label>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
              <button className="erp-btn" onClick={onAbsenceClose} disabled={busy}>취소</button>
              <button className="erp-btn primary" onClick={saveAbsence} disabled={busy}>등록</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const overlay: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50,
};
const modal: React.CSSProperties = { width: 380, maxWidth: "90vw" };
const field: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "56px 1fr", alignItems: "center", gap: 10, marginBottom: 10, fontSize: 13,
};
