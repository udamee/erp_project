"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ErpLayout from "@/components/ErpLayout";
import { PaymentTarget, settlementPaymentApi } from "@/lib/api";
import "../settlement.css";

export default function PaymentsPage() {
  const router = useRouter();
  const [list, setList] = useState<PaymentTarget[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
  const pagedList = list.slice((page - 1) * pageSize, page * pageSize);
  
  const pageNumbers = Array.from(
    { length: Math.min(totalPages, 10) },
    (_, i) => i + 1
  );

  const formatMoney = (value?: number) => {
    return `${(value ?? 0).toLocaleString()}원`;
  };

  const fetchList = () => {
    setLoading(true);

    settlementPaymentApi
      .targets(customerName)
      .then((data) => {
        setList(data ?? []);
        setPage(1);
      })
      .catch((err) => {
        console.error("수금 대상 조회 실패:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    const timer = setTimeout(fetchList, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ErpLayout title="수금관리">
      <div className="erp-filter">
        <input
          className="erp-input"
          placeholder="거래처명 검색"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") fetchList();
          }}
        />

        <button className="erp-btn primary" onClick={fetchList}>
          검색
        </button>

        <button
          className="erp-btn"
          onClick={() => {
            setCustomerName("");
            setTimeout(fetchList, 0);
          }}
        >
          초기화
        </button>
      </div>

      <div className="erp-table-wrap">
        <table className="erp-table">
          <thead>
            <tr>
              <th>거래처명</th>
              <th className="num">청구금액</th>
              <th className="num">수금금액</th>
              <th className="num">남은 미수금</th>
              <th>만기일</th>
              <th>상태</th>
              <th>수금등록</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: 40 }}>
                  불러오는 중...
                </td>
              </tr>
            ) : list.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: 40 }}>
                  조회된 수금 대상이 없습니다.
                </td>
              </tr>
            ) : (
              pagedList.map((item) => (
                <tr key={item.arId}>
                  <td>{item.customerName}</td>
                  <td className="num">{formatMoney(item.totalAmount)}</td>
                  <td className="num">{formatMoney(item.paidAmount)}</td>
                  <td className="num">{formatMoney(item.remainAmount)}</td>
                  <td>{item.dueDate?.slice(0, 10)}</td>
                  <td>{item.status}</td>
                  <td>
                    <button
                      className="erp-btn primary"
                      onClick={() =>
                        router.push(`/settlement/payments/new/${item.arId}`)
                      }
                    >
                      등록
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {!loading && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 4,
              padding: 12,
            }}
          >
            <button
              className="erp-btn"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              &lt;
            </button>

            {pageNumbers.map((p) => (
              <button
                key={p}
                className="erp-btn"
                onClick={() => setPage(p)}
                style={{
                  background: p === page ? "var(--erp-primary)" : "#fff",
                  color: p === page ? "#fff" : "var(--erp-text)",
                  borderColor:
                    p === page ? "var(--erp-primary)" : "var(--erp-line)",
                  minWidth: 36,
                }}
              >
                {p}
              </button>
            ))}

            <button
              className="erp-btn"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              &gt;
            </button>
          </div>
        )}
      </div>
    </ErpLayout>
  );
}
