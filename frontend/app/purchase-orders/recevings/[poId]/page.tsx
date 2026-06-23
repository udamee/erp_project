// app/receivings/[poId]/page.tsx — 입고 처리 (로트번호·유효기간 입력)
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ErpLayout from "@/components/ErpLayout";
import { receivingApi, ReceivingDetailInput } from "@/lib/api";

export default function ReceivingProcessPage() {
  const { poId } = useParams<{ poId: string }>();
  const router = useRouter();

  const [rows, setRows] = useState<ReceivingDetailInput[]>([]);
  const [memo, setMemo] = useState("");
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  // 발주 품목을 입고 입력 폼으로 변환
  useEffect(() => {
    receivingApi
      .detailsByPoId(Number(poId))
      .then((details) =>
        setRows(
          details.map((d) => ({
            productId: d.productId,
            productName: d.productName,
            orderQty: d.orderQty,
            lotNo: "",
            expiryDate: "",
            receivedQty: d.orderQty, // 기본값: 발주 수량
            unitPrice: d.unitPrice,
          }))
        )
      )
      .catch((e: Error) => setError(e.message));
  }, [poId]);

  const updateRow = (index: number, field: keyof ReceivingDetailInput, value: string | number) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  // 유효기간 만료 검사 (백엔드 INVALID_EXPIRY_DATE와 동일 기준)
  const isExpired = (date: string) => date !== "" && new Date(date) < new Date();

  const handleSubmit = async () => {
    // 클라이언트 유효성 검사
    for (const row of rows) {
      if (!row.lotNo.trim()) return alert(`${row.productName}: 로트번호를 입력해주세요.`);
      if (!row.expiryDate) return alert(`${row.productName}: 유효기간을 입력해주세요.`);
      if (isExpired(row.expiryDate)) return alert(`${row.productName}: 유효기간이 만료된 날짜입니다.`);
      if (!row.receivedQty || row.receivedQty < 1) return alert(`${row.productName}: 입고 수량을 확인해주세요.`);
    }

    if (!confirm("입고 처리하시겠습니까? 처리 후 재고가 자동 생성됩니다.")) return;

    setProcessing(true);
    try {
      await receivingApi.process({
        poId: Number(poId),
        memo: memo || undefined,
        details: rows.map(({ productName, orderQty, ...rest }) => rest), // 화면용 필드 제거
      });
      alert("입고 처리가 완료되었습니다.");
      router.push("/receivings");
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ErpLayout title={`입고 처리 — PO-${String(poId).padStart(4, "0")}`} back>

      {error && <p className="erp-warn-text">{error}</p>}

      <div className="erp-table-wrap">
        <table className="erp-table">
          <thead>
            <tr>
              <th>제품명</th>
              <th className="num">발주수량</th>
              <th style={{ width: 160 }}>로트번호 *</th>
              <th style={{ width: 160 }}>유효기간 *</th>
              <th style={{ width: 110 }}>입고수량 *</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.productId} style={{ cursor: "default" }}>
                <td>{row.productName}</td>
                <td className="num">{row.orderQty}</td>
                <td>
                  <input
                    className="erp-input"
                    style={{ width: "100%" }}
                    placeholder="LOT-2606-A01"
                    value={row.lotNo}
                    onChange={(e) => updateRow(i, "lotNo", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="date"
                    className={`erp-input ${isExpired(row.expiryDate) ? "error" : ""}`}
                    style={{ width: "100%" }}
                    value={row.expiryDate}
                    onChange={(e) => updateRow(i, "expiryDate", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="erp-input"
                    style={{ width: "100%", textAlign: "right" }}
                    min={1}
                    value={row.receivedQty}
                    onChange={(e) => updateRow(i, "receivedQty", Number(e.target.value))}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.some((r) => isExpired(r.expiryDate)) && (
        <p className="erp-warn-text">⚠ 유효기간이 이미 만료된 품목이 있습니다. 날짜를 확인해주세요.</p>
      )}

      <div>
        <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 6px" }}>메모</p>
        <input
          className="erp-input"
          style={{ width: "100%" }}
          placeholder="입고 관련 메모를 입력하세요 (선택)"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />
      </div>

      <div className="erp-page-actions">
        <button className="erp-btn" onClick={() => router.back()}>취소</button>
        <button className="erp-btn primary" disabled={processing || rows.length === 0} onClick={handleSubmit}>
          {processing ? "처리 중..." : "입고 처리 완료"}
        </button>
      </div>
    </ErpLayout>
  );
}
