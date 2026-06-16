"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ErpLayout from "@/components/ErpLayout";
import StatusBadge from "@/components/StatusBadge";
import { purchaseOrderApi, PurchaseOrder } from "@/lib/api";

const TABS = [
  { key: "", label: "전체" },
  { key: "REQUESTED", label: "승인 대기" },
  { key: "APPROVED", label: "승인 완료" },
  { key: "REJECTED", label: "반려" },
  { key: "COMPLETED", label: "입고 완료" },
];

export default function PurchaseOrderListPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [tab, setTab] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // 상태별 개수 (탭 뱃지)
  useEffect(() => {
    purchaseOrderApi.statusCounts().then(setCounts).catch(() => {});
  }, [orders]);

  // 목록 조회 (탭·페이지 변경 시)
  useEffect(() => {
    setLoading(true);
    purchaseOrderApi
      .listPaging(tab, page, 10)
      .then((res) => {
        setOrders(res.list);
        setTotalPages(res.totalPages);
        setTotal(res.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tab, page]);

  // 탭 변경 시 1페이지로
  const handleTab = (key: string) => {
    setTab(key);
    setPage(1);
  };

  // 전체 개수 계산
  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <ErpLayout title="발주 관리">
      {/* 탭 */}
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--erp-line)" }}>
        {TABS.map((t) => {
          const count = t.key === "" ? totalCount : counts[t.key] ?? 0;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => handleTab(t.key)}
              style={{
                padding: "10px 16px",
                border: "none",
                background: "none",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: active ? 600 : 400,
                color: active ? "var(--erp-primary)" : "var(--erp-text-muted)",
                borderBottom: active ? "2px solid var(--erp-primary)" : "2px solid transparent",
                marginBottom: -1,
              }}
            >
              {t.label}
              <span style={{
                marginLeft: 6, fontSize: 12,
                background: active ? "var(--erp-primary-bg)" : "var(--erp-bg)",
                color: active ? "var(--erp-primary-dark)" : "var(--erp-text-muted)",
                padding: "1px 8px", borderRadius: 999,
              }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* 등록 버튼 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, color: "var(--erp-text-muted)" }}>총 {total}건</span>
        <button className="erp-btn primary" onClick={() => router.push("/purchase-orders/new")}>
          + 발주 등록
        </button>
      </div>

      {/* 테이블 */}
      <div className="erp-table-wrap">
        <table className="erp-table">
          <thead>
            <tr>
              <th>발주번호</th>
              <th>공급처</th>
              <th>기안자</th>
              <th>발주일</th>
              <th>상태</th>
              <th className="num">총금액</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: 40 }}>불러오는 중...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: 40 }}>발주 내역이 없습니다.</td></tr>
            ) : (
              orders.map((o) => (
                <tr key={o.poId} onClick={() => router.push(`/purchase-orders/${o.poId}`)}>
                  <td className="link">PO-{String(o.poId).padStart(4, "0")}</td>
                  <td>{o.supplierName}</td>
                  <td>{o.requestEmpName}</td>
                  <td>{o.poDate?.slice(0, 10)}</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td className="num">{o.totalAmount?.toLocaleString()}원</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 8 }}>
          <button
            className="erp-btn"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            style={{ height: 32 }}
          >
            이전
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className="erp-btn"
              style={{
                height: 32, minWidth: 32,
                background: p === page ? "var(--erp-primary)" : "#fff",
                color: p === page ? "#fff" : "var(--erp-text)",
                borderColor: p === page ? "var(--erp-primary)" : "var(--erp-line)",
              }}
            >
              {p}
            </button>
          ))}
          <button
            className="erp-btn"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            style={{ height: 32 }}
          >
            다음
          </button>
        </div>
      )}
    </ErpLayout>
  );
}