"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ErpLayout from "@/components/ErpLayout";
import { paymentTypeLabel } from "@/lib/display-labels";
import "../../settlement.css";

type PayablePayment = {
    payablePaymentId: number;
    apId: number;
    supplierId: number;
    supplierName: string;
    paymentDate: string;
    paymentAmount: number;
    paymentType: string;
    createdBy: number;
    createdByName: string;
    createdAt: string;
};

export default function PayablePaymentHistoryPage() {
    const router = useRouter();
    const [list, setList] = useState<PayablePayment[]>([]);
    const [supplierName, setSupplierName] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
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
        setErrorMessage("");

        const params = new URLSearchParams();

        if (supplierName) params.append("supplierName", supplierName);
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);

        const query = params.toString() ? `?${params.toString()}` : "";

        fetch(`http://localhost:8080/api/settlement/payables/payments${query}`)
            .then(async (response) => {
                const body = await response.json().catch(() => null);

                if (!response.ok || body?.success === false) {
                    throw new Error(body?.message ?? "Failed to load payable payments.");
                }

                return body;
            })
            .then((body) => {
                setList(body.data ?? []);
                setPage(1);
            })
            .catch((err) => {
                setList([]);
                setErrorMessage(err instanceof Error ? err.message : "Failed to load payable payments.");
                console.error("지급내역 조회 실패:", err);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        const timer = setTimeout(fetchList, 0);
        return () => clearTimeout(timer);
    }, []);

    return (
        <ErpLayout title="지급내역 조회">
            <div className="erp-filter">
                <input
                    className="erp-input"
                    placeholder="공급처명 검색"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") fetchList();
                    }}
                />

                <input
                    className="erp-input"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                />

                <input
                    className="erp-input"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                />

                <button className="erp-btn primary" onClick={fetchList}>
                    조회
                </button>

                <button
                    className="erp-btn"
                    onClick={() => {
                        setSupplierName("");
                        setStartDate("");
                        setEndDate("");
                        setTimeout(fetchList, 0);
                    }}
                >
                    초기화
                </button>

                <button
                    className="erp-btn"
                    onClick={() => router.push("/settlement/payables")}
                >
                    미지급금 관리
                </button>
            </div>

            <div className="erp-table-wrap">
                <table className="erp-table">
                    <thead>
                        <tr>
                            <th>지급번호</th>
                            <th>미지급번호</th>
                            <th>공급처명</th>
                            <th>지급일자</th>
                            <th className="num">지급금액</th>
                            <th>지급방법</th>
                            <th>처리자</th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} style={{ textAlign: "center", padding: 40 }}>
                                    불러오는 중...
                                </td>
                            </tr>
                        ) : errorMessage ? (
                            <tr>
                                <td colSpan={7} style={{ textAlign: "center", padding: 40 }}>
                                    {errorMessage}
                                </td>
                            </tr>
                        ) : list.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ textAlign: "center", padding: 40 }}>
                                    조회된 지급내역이 없습니다.
                                </td>
                            </tr>
                        ) : (
                            pagedList.map((item) => (
                                <tr key={item.payablePaymentId}>
                                    <td>PP-{String(item.payablePaymentId).padStart(4, "0")}</td>
                                    <td>AP-{String(item.apId).padStart(4, "0")}</td>
                                    <td>{item.supplierName ?? `공급처 ${item.supplierId}`}</td>
                                    <td>{item.paymentDate?.slice(0, 10)}</td>
                                    <td className="num">{formatMoney(item.paymentAmount)}</td>
                                    <td>{paymentTypeLabel(item.paymentType)}</td>
                                    <td>{item.createdByName}</td>
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
                                    borderColor: p === page ? "var(--erp-primary)" : "var(--erp-line)",
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
