"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ErpLayout from "@/components/ErpLayout";
import "../settlement.css";

type SalesInvoice = {
    salesInvoiceId: number;
    soId: number;
    customerId: number;
    customerName: string;
    issueDate: string;
    totalAmount: number;
    status: string;
    createdAt: string;
};

export default function SalesInvoiceListPage() {
    const router = useRouter();
    const [list, setList] = useState<SalesInvoice[]>([]);
    const [status, setStatus] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
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
        const params = new URLSearchParams();
        
        if (customerName) params.append("customerName", customerName);
        if (status) params.append("status", status);
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);
        const query = params.toString() ? `?${params.toString()}` : "";

        fetch(`http://localhost:8080/api/settlement/invoices${query}`)
        .then((res) => res.json())
        .then((res) => {
            setList(res.data ?? res ?? []);
            setPage(1);
        })
        .catch((err) => {
            console.error("매출청구 목록 조회 실패:", err);
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
        <ErpLayout title="매출청구 목록">
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

                <select
                    className="erp-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                >
                    <option value="">전체 상태</option>
                    <option value="ISSUED">ISSUED</option>
                </select>

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
                        setCustomerName("");
                        setStatus("");
                        setStartDate("");
                        setEndDate("");
                        setTimeout(fetchList, 0);
                    }}
                >
                    초기화
                </button>
                {/* <button
                    className="erp-btn primary"
                    onClick={() => router.push("/settlement/receivables?mode=invoice")}
                >
                    매출청구 등록
                </button> */}
            </div>

            <div className="erp-table-wrap">
                <table className="erp-table">
                    <thead>
                        <tr>
                            <th>청구번호</th>
                            <th>수주번호</th>
                            <th>거래처명</th>
                            <th>청구일자</th>
                            <th className="num">청구금액</th>
                            <th>상태</th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                        <tr>
                            <td colSpan={6} style={{ textAlign: "center", padding: 40 }}>
                                불러오는 중...
                            </td>
                        </tr>
                        ) : list.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: "center", padding: 40 }}>
                                    조회된 매출청구가 없습니다.
                                </td>
                            </tr>
                        ) : (
                            pagedList.map((item) => (
                                <tr key={item.salesInvoiceId}>
                                    <td>SI-{String(item.salesInvoiceId).padStart(4, "0")}</td>
                                    <td>SO-{String(item.soId).padStart(4, "0")}</td>
                                    <td>{item.customerName}</td>
                                    {/* <td
                                        className="link"
                                        onClick={() => router.push(`/settlement/invoices/${item.customerId}`)}
                                    >
                                        {item.customerName ?? `거래처 ${item.customerId}`}
                                    </td> */}
                                    <td>{item.issueDate?.slice(0, 10)}</td>
                                    <td className="num">{formatMoney(item.totalAmount)}</td>
                                    <td>{item.status}</td>
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
                            gap: 8,
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