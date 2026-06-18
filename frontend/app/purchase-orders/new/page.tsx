// app/purchase-orders/new/page.tsx — 발주 등록 (중복 방지 + 빠른 추가)
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ErpLayout from "@/components/ErpLayout";
import { purchaseOrderApi } from "@/lib/api";

interface Supplier {
  supplierId: number;
  supplierName: string;
}

interface Product {
  productId: number;
  productCode: string;
  productName: string;
  unit: string;
  standardPurchasePrice: number;
}

interface OrderRow {
  productId: number;
  orderQty: number;
  unitPrice: number;
}

export default function PurchaseOrderCreatePage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [supplierId, setSupplierId] = useState<number>(0);
  const [memo, setMemo] = useState("");
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [processing, setProcessing] = useState(false);

  // 빠른 추가 모달
  const [showPicker, setShowPicker] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [checked, setChecked] = useState<Set<number>>(new Set());

  // 공급처·의약품 목록 조회
  useEffect(() => {
    purchaseOrderApi.suppliers().then(setSuppliers).catch((e) => alert(e.message));
    purchaseOrderApi.products()
      .then((data) => setProducts(data as unknown as Product[]))
      .catch((e) => alert(e.message));
  }, []);

  // 이미 발주 목록에 담긴 의약품 ID (중복 방지용)
  const selectedIds = useMemo(() => new Set(rows.map((r) => r.productId)), [rows]);

  // 품목 행 삭제
  const removeRow = (productId: number) => {
    setRows(rows.filter((r) => r.productId !== productId));
  };

  // 행 수정 (수량·단가)
  const updateRow = (productId: number, field: "orderQty" | "unitPrice", value: number) => {
    setRows((prev) =>
      prev.map((row) => (row.productId === productId ? { ...row, [field]: value } : row))
    );
  };

  // ===== 빠른 추가 모달 =====

  // 모달 열기 (체크 초기화)
  const openPicker = () => {
    setChecked(new Set());
    setKeyword("");
    setShowPicker(true);
  };

  // 검색 필터 (이미 담긴 건 제외)
  const filteredProducts = products.filter((p) => {
    if (selectedIds.has(p.productId)) return false; // 중복 방지: 이미 담긴 건 안 보임
    if (!keyword) return true;
    return (
      p.productName.toLowerCase().includes(keyword.toLowerCase()) ||
      p.productCode.toLowerCase().includes(keyword.toLowerCase())
    );
  });

  // 체크박스 토글
  const toggleCheck = (productId: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  // 선택한 품목들 일괄 추가
  const addChecked = () => {
    if (checked.size === 0) return alert("추가할 의약품을 선택해주세요.");
    const newRows: OrderRow[] = products
      .filter((p) => checked.has(p.productId))
      .map((p) => ({
        productId: p.productId,
        orderQty: 1,
        unitPrice: p.standardPurchasePrice, // 표준 매입가 자동 입력
      }));
    setRows([...rows, ...newRows]);
    setShowPicker(false);
  };

  // 품목 정보 헬퍼
  const getProduct = (productId: number) => products.find((p) => p.productId === productId);

  // 총금액 계산
  const totalAmount = rows.reduce((sum, r) => sum + r.orderQty * r.unitPrice, 0);

  // 발주 등록
  const handleSubmit = async () => {
    if (!supplierId) return alert("공급처를 선택해주세요.");
    if (rows.length === 0) return alert("발주할 의약품을 1개 이상 추가해주세요.");
    for (const row of rows) {
      if (row.orderQty < 1) return alert("수량은 1 이상이어야 합니다.");
    }

    setProcessing(true);
    try {
      await purchaseOrderApi.create({
        supplierId,
        memo: memo || undefined,
        details: rows,
      });
      alert("발주가 등록되었습니다.");
      router.push("/purchase-orders");
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ErpLayout title="발주 등록">
      <button className="erp-btn" style={{ alignSelf: "flex-start" }} onClick={() => router.back()}>
        ← 목록으로
      </button>

      <div className="erp-cards" style={{ gridTemplateColumns: "1fr 2fr" }}>
        <div className="erp-card">
          <p>공급처 *</p>
          <select
            className="erp-select"
            style={{ width: "100%" }}
            value={supplierId}
            onChange={(e) => setSupplierId(Number(e.target.value))}
          >
            <option value={0}>공급처 선택</option>
            {suppliers.map((s) => (
              <option key={s.supplierId} value={s.supplierId}>{s.supplierName}</option>
            ))}
          </select>
        </div>
        <div className="erp-card">
          <p>메모</p>
          <input
            className="erp-input"
            style={{ width: "100%" }}
            placeholder="발주 관련 메모 (선택)"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </div>
      </div>

      {/* 품목 추가 버튼 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, color: "var(--erp-text-muted)" }}>
          발주 품목 {rows.length}개
        </span>
        <button className="erp-btn primary" onClick={openPicker}>+ 의약품 추가</button>
      </div>

      <div className="erp-table-wrap">
        <table className="erp-table">
          <thead>
            <tr>
              <th>의약품</th>
              <th style={{ width: 110 }}>수량 *</th>
              <th style={{ width: 130 }}>단가 *</th>
              <th className="num" style={{ width: 120 }}>금액</th>
              <th style={{ width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: 40, color: "var(--erp-text-muted)" }}>
                  "+ 의약품 추가" 버튼으로 품목을 추가하세요.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const product = getProduct(row.productId);
                return (
                  <tr key={row.productId} style={{ cursor: "default" }}>
                    <td>
                      <span style={{ fontWeight: 500 }}>{product?.productName}</span>
                      <br />
                      <span style={{ fontSize: 12, color: "var(--erp-text-muted)" }}>
                        {product?.productCode} · {product?.unit}
                      </span>
                    </td>
                    <td>
                      <input
                        type="number"
                        className="erp-input"
                        style={{ width: "100%", textAlign: "right" }}
                        min={1}
                        value={row.orderQty}
                        onChange={(e) => updateRow(row.productId, "orderQty", Number(e.target.value))}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="erp-input"
                        style={{ width: "100%", textAlign: "right" }}
                        min={0}
                        value={row.unitPrice}
                        onChange={(e) => updateRow(row.productId, "unitPrice", Number(e.target.value))}
                      />
                    </td>
                    <td className="num">{(row.orderQty * row.unitPrice).toLocaleString()}</td>
                    <td>
                      <button
                        className="erp-btn danger-outline"
                        style={{ height: 30, padding: "0 10px" }}
                        onClick={() => removeRow(row.productId)}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
        <p style={{ margin: 0, fontSize: 15 }}>
          총금액 <strong style={{ fontSize: 18 }}>{totalAmount.toLocaleString()}원</strong>
        </p>
      </div>

      <div className="erp-page-actions">
        <button className="erp-btn" onClick={() => router.back()}>취소</button>
        <button className="erp-btn primary" disabled={processing} onClick={handleSubmit}>
          {processing ? "등록 중..." : "발주 등록"}
        </button>
      </div>

      {/* 빠른 추가 모달 */}
      {showPicker && (
        <div className="erp-modal-overlay" onClick={() => setShowPicker(false)}>
          <div
            className="erp-modal"
            style={{ width: 520 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>의약품 추가</h3>
            <p className="desc">추가할 의약품을 검색하고 체크하세요. 여러 개 선택할 수 있습니다.</p>

            <input
              className="erp-input"
              style={{ width: "100%", marginBottom: 10 }}
              placeholder="의약품명 또는 코드 검색"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              autoFocus
            />

            <div style={{ maxHeight: 320, overflowY: "auto", border: "1px solid var(--erp-line)", borderRadius: 8 }}>
              {filteredProducts.length === 0 ? (
                <p style={{ textAlign: "center", padding: 30, color: "var(--erp-text-muted)", fontSize: 13 }}>
                  {keyword ? "검색 결과가 없습니다." : "추가할 수 있는 의약품이 없습니다."}
                </p>
              ) : (
                filteredProducts.map((p) => (
                  <label
                    key={p.productId}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 14px", borderBottom: "1px solid var(--erp-line)",
                      cursor: "pointer",
                      background: checked.has(p.productId) ? "var(--erp-primary-bg)" : "#fff",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked.has(p.productId)}
                      onChange={() => toggleCheck(p.productId)}
                    />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{p.productName}</span>
                      <br />
                      <span style={{ fontSize: 12, color: "var(--erp-text-muted)" }}>
                        {p.productCode} · {p.standardPurchasePrice?.toLocaleString()}원
                      </span>
                    </div>
                  </label>
                ))
              )}
            </div>

            <div className="actions">
              <span style={{ flex: 1, fontSize: 13, color: "var(--erp-text-muted)", alignSelf: "center" }}>
                {checked.size}개 선택됨
              </span>
              <button className="erp-btn" onClick={() => setShowPicker(false)}>취소</button>
              <button className="erp-btn primary" onClick={addChecked}>
                선택 추가
              </button>
            </div>
          </div>
        </div>
      )}
    </ErpLayout>
  );
}