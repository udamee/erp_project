"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ErpLayout from "@/components/ErpLayout";
import { SalesInvoice, settlementInvoiceApi } from "@/lib/api";
import "../../settlement.css";

export default function SalesInvoiceDetailPage() {
    const router = useRouter();
    const params = useParams();
    const salesInvoiceId = params.salesInvoiceId as string;

    const [invoice, setInvoice] = useState<SalesInvoice | null>(null);
    const [loading, setLoading] = useState(true);

    const formatMoney = (value?: number) => {
        return `${(value ?? 0).toLocaleString()}원`;
    };

    useEffect(() => {
        if (!salesInvoiceId) {
            setLoading(false);
            return;
        }

        settlementInvoiceApi
            .detail(Number(salesInvoiceId))
            .then((data) => {
                setInvoice(data ?? null);
            })
            .catch((err) => {
                console.error("매출청구 상세 조회 실패:", err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [salesInvoiceId]);

    return (
        <ErpLayout title="매출청구 상세">
            {loading ? (
                <div className="erp-card">불러오는 중...</div>
            ) : !invoice ? (
                <div className="erp-card">매출청구 정보를 찾을 수 없습니다.</div>
            ) : (
                <>
                    <div className="erp-card">
                        <h3>매출청구 정보</h3>

                        <div className="erp-cards">
                            <div className="erp-card">
                                <p>청구번호</p>
                                <strong>SI-{String(invoice.salesInvoiceId).padStart(4, "0")}</strong>
                            </div>

                            <div className="erp-card">
                                <p>수주번호</p>
                                <strong>SO-{String(invoice.soId).padStart(4, "0")}</strong>
                            </div>

                            <div className="erp-card">
                                <p>거래처명</p>
                                <strong>{invoice.customerName ?? `거래처 ${invoice.customerId}`}</strong>
                            </div>

                            <div className="erp-card">
                                <p>청구일자</p>
                                <strong>{invoice.issueDate?.slice(0, 10)}</strong>
                            </div>

                            <div className="erp-card">
                                <p>청구금액</p>
                                <strong>{formatMoney(invoice.totalAmount)}</strong>
                            </div>

                            <div className="erp-card">
                                <p>상태</p>
                                <strong>{invoice.status}</strong>
                            </div>
                        </div>
                    </div>

                    <div className="erp-page-actions">
                        <button
                            className="erp-btn"
                            onClick={() => router.push("/settlement/invoices")}
                        >
                            목록
                        </button>
                    </div>
                </>
            )}
        </ErpLayout>
    );
}