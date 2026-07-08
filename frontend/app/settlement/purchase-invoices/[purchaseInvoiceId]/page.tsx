"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ErpLayout from "@/components/ErpLayout";
import { PurchaseInvoice, settlementPurchaseInvoiceApi } from "@/lib/api";
import "../../settlement.css";

export default function PurchaseInvoiceDetailPage() {
    const router = useRouter();
    const params = useParams();
    const purchaseInvoiceId = params.purchaseInvoiceId as string;

    const [invoice, setInvoice] = useState<PurchaseInvoice | null>(null);
    const [loading, setLoading] = useState(true);

    const formatMoney = (value?: number) => {
        return `${(value ?? 0).toLocaleString()}원`;
    };

    useEffect(() => {
        if (!purchaseInvoiceId) {
            setLoading(false);
            return;
        }

        settlementPurchaseInvoiceApi
            .detail(Number(purchaseInvoiceId))
            .then((data) => {
                setInvoice(data ?? null);
            })
            .catch((err) => {
                console.error("매입청구 상세 조회 실패:", err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [purchaseInvoiceId]);

    return (
        <ErpLayout title="매입청구 상세">
            {loading ? (
                <div className="erp-card">불러오는 중...</div>
            ) : !invoice ? (
                <div className="erp-card">매입청구 정보를 찾을 수 없습니다.</div>
            ) : (
                <>
                    <div className="erp-card">
                        <h3>매입청구 정보</h3>

                        <div className="erp-cards">
                            <div className="erp-card">
                                <p>매입청구번호</p>
                                <strong>PI-{String(invoice.purchaseInvoiceId).padStart(4, "0")}</strong>
                            </div>

                            <div className="erp-card">
                                <p>발주번호</p>
                                <strong>PO-{String(invoice.poId).padStart(4, "0")}</strong>
                            </div>

                            <div className="erp-card">
                                <p>공급처명</p>
                                <strong>{invoice.supplierName ?? `공급처 ${invoice.supplierId}`}</strong>
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
                            onClick={() => router.push("/settlement/purchase-invoices")}
                        >
                            목록
                        </button>
                    </div>
                </>
            )}
        </ErpLayout>
    );
}