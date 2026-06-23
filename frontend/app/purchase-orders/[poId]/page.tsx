// app/purchase-orders/[poId]/page.tsx — 발주 상세 + 승인/반려
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ErpLayout from "@/components/ErpLayout";
import StatusBadge from "@/components/StatusBadge";
import { purchaseOrderApi, PurchaseOrder, userStorage } from "@/lib/api";

export default function PurchaseOrderDetailPage() {
  const { poId } = useParams<{ poId: string }>();
  const router = useRouter();

  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [error, setError] = useState("");
  const [role] = useState(() => userStorage.get()?.role ?? "");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const load = () => {
    purchaseOrderApi
      .detail(Number(poId))
      .then(setOrder)
      .catch((e: Error) => setError(e.message));
  };

  useEffect(load, [poId]);

  // 발주 승인
  const handleApprove = async () => {
    if (!confirm("이 발주를 승인하시겠습니까?")) return;
    setProcessing(true);
    try {
      await purchaseOrderApi.approve(Number(poId));
      alert("발주가 승인되었습니다.");
      router.push(`/purchase-orders`); // 목록이동
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  // 발주 반려
  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert("반려 사유를 입력해주세요.");
      return;
    }
    setProcessing(true);
    try {
      await purchaseOrderApi.reject(Number(poId), rejectReason);
      alert("발주가 반려되었습니다.");
      setShowRejectModal(false);
      router.push(`/purchase-orders`); // 목록 이동
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  if (error) return <ErpLayout title="발주 상세" back><p className="erp-warn-text">{error}</p></ErpLayout>;
  if (!order) return <ErpLayout title="발주 상세" back><p>불러오는 중...</p></ErpLayout>;

  return (
    <ErpLayout title={`발주 상세 — PO-${String(order.poId).padStart(4, "0")}`} back>
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
        <StatusBadge status={order.status} />
      </div>

      <div className="erp-cards">
        <div className="erp-card">
          <p>공급처</p>
          <strong>{order.supplierName}</strong>
          {order.supplierPhone && <p style={{ marginTop: 4 }}>{order.supplierPhone}</p>}
        </div>
        <div className="erp-card">
          <p>기안자</p>
          <strong>{order.requestEmpName}</strong>
          <p style={{ marginTop: 4 }}>발주일 {order.poDate?.slice(0, 10)}</p>
        </div>
        <div className="erp-card">
          <p>총금액</p>
          <strong>{order.totalAmount?.toLocaleString()}원</strong>
          {order.approveEmpName && <p style={{ marginTop: 4 }}>승인자 {order.approveEmpName}</p>}
        </div>
      </div>

      <div className="erp-table-wrap">
        <table className="erp-table">
          <thead>
            <tr>
              <th>제품코드</th>
              <th>제품명</th>
              <th className="num">수량</th>
              <th className="num">단가</th>
              <th className="num">금액</th>
            </tr>
          </thead>
          <tbody>
            {order.details?.map((d) => (
              <tr key={d.poDetailId} style={{ cursor: "default" }}>
                <td>{d.productCode}</td>
                <td>{d.productName}</td>
                <td className="num">{d.orderQty?.toLocaleString()}</td>
                <td className="num">{d.unitPrice?.toLocaleString()}</td>
                <td className="num">{d.amount?.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {order.memo && (
        <p style={{ fontSize: 13, color: "var(--erp-text-muted)", margin: 0 }}>메모: {order.memo}</p>
      )}

      {/* 승인 대기 + MANAGER/ADMIN일 때만 버튼 노출 */}
      {order.status === "REQUESTED" && (role === "MANAGER" || role === "ADMIN") && (
        <div className="erp-page-actions">
          <button className="erp-btn danger-outline" disabled={processing} onClick={() => setShowRejectModal(true)}>
            반려
          </button>
          <button className="erp-btn primary" disabled={processing} onClick={handleApprove}>
            승인
          </button>
        </div>
      )}

      {/* 반려 사유 입력 모달 */}
      {showRejectModal && (
        <div className="erp-modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="erp-modal" onClick={(e) => e.stopPropagation()}>
            <h3>발주 반려</h3>
            <p className="desc">
              PO-{String(order.poId).padStart(4, "0")} 발주를 반려합니다. 반려 사유는 기안자에게 전달됩니다.
            </p>
            <textarea
              className="erp-textarea"
              placeholder="반려 사유를 입력해주세요"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="actions">
              <button className="erp-btn" onClick={() => setShowRejectModal(false)}>취소</button>
              <button className="erp-btn danger" disabled={processing} onClick={handleReject}>
                반려 확정
              </button>
            </div>
          </div>
        </div>
      )}
    </ErpLayout>
  );
}
