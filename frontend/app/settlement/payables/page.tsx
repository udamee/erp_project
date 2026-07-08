"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ErpLayout from "@/components/ErpLayout";
import { AccountPayable, settlementPayableApi } from "@/lib/api";
import "../settlement.css";

export default function PayablesPage() {
    const router = useRouter();

    const [list, setList] = useState<AccountPayable[]>([]);
    const [status, setStatus] = useState("");
    const [supplierName, setSupplierName] = useState("");
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

        settlementPayableApi
            .list({
                supplierName,
                status,
                startDate,
                endDate,
            })
            .then((data) => {
                setList(data ?? []);
                setPage(1);
            })
            .catch((err) => {
                console.error("미지급금 조회 실패:", err);
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
        <ErpLayout title="미지급금 관리">
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

                <select
                    className="erp-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                >
                    <option value="">전체 상태</option>
                    <option value="UNPAID">UNPAID</option>
                    <option value="PARTIAL">PARTIAL</option>
                    <option value="PAID">PAID</option>
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
                        setSupplierName("");
                        setStatus("");
                        setStartDate("");
                        setEndDate("");
                        setTimeout(fetchList, 0);
                    }}
                >
                    초기화
                </button>

                <button
                    className="erp-btn"
                    onClick={() => router.push("/settlement/payables/history")}
                >
                    지급내역
                </button>
            </div>
        
            <div className="erp-table-wrap">
                <table className="erp-table">
                    <thead>
                        <tr>
                            <th>미지급번호</th>
                            <th>매입청구번호</th>
                            <th>공급처명</th>
                            <th>지급예정일</th>
                            <th className="num">총 지급금액</th>
                            <th className="num">지급완료금액</th>
                            <th className="num">미지급잔액</th>
                            <th>상태</th>
                            <th>지급등록</th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={9} style={{ textAlign: "center", padding: 40 }}>
                                    불러오는 중...
                                </td>
                            </tr>
                        ) : list.length === 0 ? (
                            <tr>
                                <td colSpan={9} style={{ textAlign: "center", padding: 40 }}>
                                    조회된 미지급금이 없습니다.
                                </td>
                            </tr>
                        ) : (
                            pagedList.map((item) => (
                                <tr key={item.apId}>
                                    <td>AP-{String(item.apId).padStart(4, "0")}</td>
                                    <td>PI-{String(item.purchaseInvoiceId).padStart(4, "0")}</td>
                                    <td>{item.supplierName ?? `공급처 ${item.supplierId}`}</td>
                                    <td>{item.dueDate?.slice(0, 10)}</td>
                                    <td className="num">{formatMoney(item.totalAmount)}</td>
                                    <td className="num">{formatMoney(item.paidAmount)}</td>
                                    <td className="num">{formatMoney(item.remainAmount)}</td>
                                    <td>{item.status}</td>
                                    <td>
                                        <button
                                            className="erp-btn primary"
                                            disabled={item.remainAmount <= 0}
                                            onClick={() => router.push(`/settlement/payables/new/${item.apId}`)}
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
