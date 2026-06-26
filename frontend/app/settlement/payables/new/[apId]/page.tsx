"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ErpLayout from "@/components/ErpLayout";
import "../../../settlement.css";

type PayableInfo = {
    apId: number;
    purchaseInvoiceId: number;
    supplierId: number;
    supplierName: string;
    dueDate: string;
    totalAmount: number;
    paidAmount: number;
    remainAmount: number;
    status: string;
};

export default function PayablePaymentPage() {
    const router = useRouter();
    const params = useParams();
    const apId = params.apId as string;
    
    const [payable, setPayable] = useState<PayableInfo | null>(null);
    const [paymentDate, setPaymentDate] = useState("");
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentType, setPaymentType] = useState("계좌이체");
    const createdBy = 1; // TODO: 로그인 연동 시 사용자 ID로 변경
    const [loading, setLoading] = useState(true);
    
    const formatMoney = (value?: number) => {
        return `${(value ?? 0).toLocaleString()}원`;
    };
    
    useEffect(() => {
        fetch(`http://localhost:8080/api/settlement/payables/${apId}`)
        .then((res) => res.json())
        .then((res) => setPayable(res.data ?? null))
        .catch((err) => console.error("미지급금 상세 조회 실패:", err))
        .finally(() => setLoading(false));
    }, [apId]);
    
    const handleSubmit = () => {
        if (!payable) {
        alert("미지급금 정보가 없습니다.");
        return;
        }

        if (!paymentDate || !paymentAmount) {
            alert("지급일자와 지급금액을 입력해주세요.");
            return;
        }

        const amount = Number(paymentAmount);

        if (amount <= 0) {
            alert("지급금액은 0보다 커야 합니다.");
            return;
        }

        if (amount > payable.remainAmount) {
            alert("지급금액은 미지급잔액보다 클 수 없습니다.");
            return;
        }

        const body = {
            apId: payable.apId,
            supplierId: payable.supplierId,
            paymentDate,
            paymentAmount: amount,
            paymentType,
            createdBy,
        };
        
        fetch("http://localhost:8080/api/settlement/payables/payment", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        })
        .then(async (res) => {
            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(errorText || "지급 처리 실패");
            }
            return res.text();
        })
        .then(() => {
            alert("지급 처리가 완료되었습니다.");
            router.push("/settlement/payables/history");
        })
        .catch((err) => {
            console.error(err);
            alert("지급 처리 중 오류가 발생했습니다.");
        });
    };
    
    return (
        <ErpLayout title="지급 처리">
            {loading ? (
                <div className="erp-card">불러오는 중...</div>
            ) : (
                <>
                    <div className="erp-card">
                        <h3>미지급금 정보</h3>
                        {payable ? (
                            <div className="erp-cards">
                                <div className="erp-card">
                                    <p>공급처명</p>
                                    <strong>{payable.supplierName}</strong>
                                </div>

                                <div className="erp-card">
                                    <p>지급금액</p>
                                    <strong>{formatMoney(payable.totalAmount)}</strong>
                                </div>

                                <div className="erp-card">
                                    <p>지급완료금액</p>
                                    <strong>{formatMoney(payable.paidAmount)}</strong>
                                </div>

                                <div className="erp-card warning">
                                    <p>미지급잔액</p>
                                    <strong>{formatMoney(payable.remainAmount)}</strong>
                                </div>

                                <div className="erp-card">
                                    <p>지급예정일</p>
                                    <strong>{payable.dueDate?.slice(0, 10)}</strong>
                                </div>

                                <div className="erp-card">
                                    <p>상태</p>
                                    <strong>{payable.status}</strong>
                                </div>
                            </div>
                        ) : (
                            <p style={{ color: "var(--erp-text-muted)" }}>
                                미지급금 정보를 찾을 수 없습니다.
                            </p>
                        )}
                    </div>
                    
                    <div className="erp-card">
                        <h3>지급 정보</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <div>
                                <p style={{ fontSize: 13, color: "var(--erp-text-muted)" }}>지급일자</p>
                                <input
                                    className="erp-input"
                                    type="date"
                                    value={paymentDate}
                                    onChange={(e) => setPaymentDate(e.target.value)}
                                    style={{ width: "100%" }}
                                />
                            </div>
                            
                            <div>
                                <p style={{ fontSize: 13, color: "var(--erp-text-muted)" }}>지급금액</p>
                                <input
                                    className="erp-input"
                                    type="number"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    placeholder="지급금액 입력"
                                    style={{ width: "100%" }}
                                />
                            </div>
                            
                            <div>
                                <p style={{ fontSize: 13, color: "var(--erp-text-muted)" }}>지급방법</p>
                                <select
                                    className="erp-select"
                                    value={paymentType}
                                    onChange={(e) => setPaymentType(e.target.value)}
                                    style={{ width: "100%" }}
                                >
                                    <option value="계좌이체">계좌이체</option>
                                    <option value="현금">현금</option>
                                    <option value="카드">카드</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="erp-page-actions">
                            <button className="erp-btn" onClick={() => router.push("/settlement/payables")}>
                                목록
                            </button>

                            <button className="erp-btn primary" onClick={handleSubmit}>
                                지급 처리
                            </button>
                        </div>
                    </div>
                </>
            )}
        </ErpLayout>
    );
}