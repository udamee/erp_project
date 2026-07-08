"use client";

import { useState } from "react";
import ErpLayout from "@/components/ErpLayout";
import { productApi, type ProductSearchCondition } from "@/lib/api";
import { useAsyncData, useRole } from "@/lib/hooks";

const won = (v: number | null | undefined) => (v != null ? `${v.toLocaleString()}원` : "-");

// 작은 상태 칩
function Pill({ text, tone }: { text: string; tone: "danger" | "primary" | "info" | "muted" }) {
  const map = {
    danger: { bg: "var(--erp-danger-bg)", fg: "var(--erp-danger)" },
    primary: { bg: "var(--erp-primary-bg)", fg: "var(--erp-primary-dark)" },
    info: { bg: "var(--erp-info-bg)", fg: "var(--erp-info)" },
    muted: { bg: "var(--erp-bg)", fg: "var(--erp-text-muted)" },
  } as const;
  const c = map[tone];
  return (
    <span style={{ background: c.bg, color: c.fg, fontSize: 12, fontWeight: 600, padding: "2px 8px", borderRadius: 999 }}>
      {text}
    </span>
  );
}

const STORAGE: Record<string, { label: string; tone: "muted" | "info" }> = {
  ROOM: { label: "실온", tone: "muted" },
  COLD: { label: "냉장", tone: "info" },
  FROZEN: { label: "냉동", tone: "info" },
};

export default function ProductPage() {
  const [keyword, setKeyword] = useState("");
  const [storageType, setStorageType] = useState("");
  const [isPrescription, setIsPrescription] = useState("");
  const [condition, setCondition] = useState<ProductSearchCondition>({});
  const [syncing, setSyncing] = useState(false);

  const role = useRole();
  const canSync = role === "ADMIN" || role === "MANAGER";

  const productData = useAsyncData(() => productApi.list(condition), [condition]);
  const products = productData.data ?? [];

  // 보관·구분 필터는 즉시 반영, 검색어는 검색 버튼/Enter로 확정
  const apply = (next: Partial<ProductSearchCondition> = {}) =>
    setCondition({
      keyword: keyword || undefined,
      storageType: storageType || undefined,
      isPrescription: isPrescription || undefined,
      ...next,
    });

  const handlePrescription = (v: string) => { setIsPrescription(v); apply({ isPrescription: v || undefined }); };
  const handleStorage = (v: string) => { setStorageType(v); apply({ storageType: v || undefined }); };

  const handleSync = async () => {
    if (!confirm("공공 API에서 전체 상품을 동기화합니다. 시간이 다소 걸릴 수 있습니다. 진행할까요?")) return;
    setSyncing(true);
    try {
      const r = await productApi.syncAll();
      alert(`동기화 완료 (기본 ${r.basicProcessedCount} · 상세 ${r.detailProcessedCount} · 성분 ${r.ingredientProcessedCount}건)`);
      productData.reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "동기화에 실패했습니다.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <ErpLayout title="상품 관리">
      {/* 검색·필터 + 동기화 */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <select className="erp-select" value={isPrescription} onChange={(e) => handlePrescription(e.target.value)}>
          <option value="">전체 구분</option>
          <option value="Y">전문 의약품</option>
          <option value="N">일반 의약품</option>
        </select>
        <select className="erp-select" value={storageType} onChange={(e) => handleStorage(e.target.value)}>
          <option value="">전체 보관</option>
          <option value="ROOM">실온</option>
          <option value="COLD">냉장</option>
          <option value="FROZEN">냉동</option>
        </select>
        <input
          className="erp-input"
          placeholder="상품명 · 상품코드 검색"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          style={{ flex: 1, maxWidth: 260 }}
        />
        <button className="erp-btn" onClick={() => apply()}>검색</button>
        {canSync && (
          <button className="erp-btn primary" style={{ marginLeft: "auto" }} disabled={syncing} onClick={handleSync}>
            {syncing ? "동기화 중..." : "상품 동기화"}
          </button>
        )}
      </div>

      <p style={{ fontSize: 12, color: "var(--erp-text-muted)", margin: "10px 0" }}>
        식약처 의약품 정보와 동기화된 상품 마스터입니다. 최신 수정순으로 최대 300건을 표시합니다.
      </p>

      {productData.error && <p className="erp-warn-text">{productData.error}</p>}

      <div className="erp-table-wrap">
        <table className="erp-table">
          <thead>
            <tr>
              <th>상품코드</th><th>상품명</th><th>제조사</th><th>단위</th><th>구분</th><th>보관</th>
              <th className="num">매입가</th><th className="num">판매가</th>
            </tr>
          </thead>
          <tbody>
            {productData.loading ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: 40 }}>불러오는 중...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: 40 }}>조회된 상품이 없습니다.</td></tr>
            ) : (
              products.map((p) => {
                const st = STORAGE[p.storageType];
                return (
                  <tr key={p.productId} style={{ cursor: "default" }}>
                    <td>{p.productCode}</td>
                    <td style={{ fontWeight: 600 }}>{p.productName}</td>
                    <td>{p.makerName ?? "-"}</td>
                    <td>{p.unit}</td>
                    <td>
                      {p.isPrescription === "Y"
                        ? <Pill text="전문" tone="danger" />
                        : <Pill text="일반" tone="primary" />}
                    </td>
                    <td>{st ? <Pill text={st.label} tone={st.tone} /> : <Pill text={p.storageType} tone="muted" />}</td>
                    <td className="num">{won(p.standardPurchasePrice)}</td>
                    <td className="num">{won(p.standardSalesPrice)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </ErpLayout>
  );
}
