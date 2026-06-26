"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import ErpLayout from "@/components/ErpLayout";
import "../../settlement.css";

type CustomerInfo = {
  customerId: number;
  customerName: string;
  monthSalesAmount: number;
  remainAmount: number;
  creditLimit: number;
  creditBalance: number;
};

export default function SalesInvoiceNewPage() {

  const router = useRouter();
  const params = useParams();
  const customerId = params.customerId as string;
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [issueDate, setIssueDate] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [status, setStatus] = useState("ISSUED");
  const [loading, setLoading] = useState(true);

  const formatMoney = (value?: number) => {
    return `${(value ?? 0).toLocaleString()}원`;
  };

  useEffect(() => {
    if (!customerId) {
      const timer = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(timer);
    }

    fetch("http://localhost:8080/api/settlement/receivables/customer-summary")
      .then((res) => res.json())
      .then((res) => {
        const list: CustomerInfo[] = res.data ?? [];
        const selected = list.find(
          (item) => String(item.customerId) === String(customerId)
        );
        setCustomer(selected ?? null);
      })
      .catch((err) => {
        console.error("거래처 정보 조회 실패:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [customerId]);

  const handleSubmit = () => {
    if (!customerId) {
      alert("거래처 정보가 없습니다.");
      return;
    }

    if (!issueDate || !totalAmount) {
      alert("청구일자와 청구금액을 입력해주세요.");
      return;
    }

    const body = {
      customerId: Number(customerId),
      soId: Date.now() % 100000,
      issueDate,
      totalAmount: Number(totalAmount),
      status,
    };

    fetch("http://localhost:8080/api/settlement/invoices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
    .then(async (res) => {
      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.message || "매출청구 등록 실패");
      }
      return res.json().catch(() => null);
    })
    .then(() => {
      alert("매출청구가 등록되었습니다.");
        router.push("/settlement/invoices");
      })
      .catch((err) => {
        console.error(err);
        alert(err.message || "매출청구 등록 중 오류가 발생했습니다.");
      });
    };

  return (
    <ErpLayout title="매출청구 등록">
      {loading ? (
        <div className="erp-card">불러오는 중...</div>
      ) : (
        <>
          <div className="erp-card">
            <h3>거래처 정보</h3>

            {customer ? (
              <div className="erp-cards">
                <div className="erp-card">
                  <p>거래처명</p>
                  <strong>{customer.customerName}</strong>
                </div>

                <div className="erp-card">
                  <p>당월 매출액</p>
                  <strong>{formatMoney(customer.monthSalesAmount)}</strong>
                </div>

                <div className="erp-card warning">
                  <p>현재 미수금</p>
                  <strong>{formatMoney(customer.remainAmount)}</strong>
                </div>

                <div className="erp-card">
                  <p>여신한도</p>
                  <strong>{formatMoney(customer.creditLimit)}</strong>
                </div>

                <div className="erp-card success">
                  <p>여신잔액</p>
                  <strong>{formatMoney(customer.creditBalance)}</strong>
                </div>
              </div>
            ) : (
              <p style={{ color: "var(--erp-text-muted)" }}>
                거래처 정보를 찾을 수 없습니다.
              </p>
            )}
          </div>

          <div className="erp-card">
            <h3>매출청구 정보</h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <p style={{ fontSize: 13, color: "var(--erp-text-muted)" }}>
                  청구일자
                </p>
                <input
                  className="erp-input"
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  style={{ width: "100%" }}
                />
              </div>

              <div>
                <p style={{ fontSize: 13, color: "var(--erp-text-muted)" }}>
                  청구금액
                </p>
                <input
                  className="erp-input"
                  type="number"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="청구금액 입력"
                  style={{ width: "100%" }}
                />
              </div>

              <div>
                <p style={{ fontSize: 13, color: "var(--erp-text-muted)" }}>
                  상태
                </p>
                <select
                  className="erp-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={{ width: "100%" }}
                >
                  <option value="ISSUED">ISSUED</option>
                </select>
              </div>
            </div>

            <div className="erp-page-actions">
              <button
                className="erp-btn"
                onClick={() => router.push("/settlement/invoices")}
              >
                목록
              </button>

              <button className="erp-btn primary" onClick={handleSubmit}>
                매출청구 등록
              </button>
            </div>
          </div>
        </>
      )}
    </ErpLayout>
  );
}