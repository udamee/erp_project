"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ErpLayout from "@/components/ErpLayout";
import { settlementApi, Settlement } from "@/lib/api";
import "../settlement.css";

export default function SettlementListPage() {
    const router = useRouter();
    
    const [list, setList] = useState<Settlement[]>([]);
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

        settlementApi
        .list(startDate, endDate)
        .then((data) => {
            setList(data ?? []);
            setPage(1);
        })
        .catch((err) => {
            console.error("손익정산 목록 조회 실패:", err);
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
        <ErpLayout title="손익정산 목록">
            <div className="erp-filter">
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
                    setStartDate("");
                    setEndDate("");
                    setTimeout(fetchList, 0);
                    }}
                >
                    초기화
                </button>

                <button
                    className="erp-btn primary"
                    onClick={() => router.push("/settlement/settlements/new")}
                >
                    손익정산 등록
                </button>
            </div>

            <div className="erp-table-wrap">
                <table className="erp-table">
                    <thead>
                        <tr>
                            <th>정산번호</th>
                            <th>시작일</th>
                            <th>종료일</th>
                            <th className="num">총 매출</th>
                            <th className="num">총 매입</th>
                            <th className="num">미수금</th>
                            <th className="num">미지급금</th>
                            <th className="num">매출총이익</th>
                            <th>이익률</th>
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
                                    조회된 손익정산이 없습니다.
                                </td>
                            </tr>
                        ) : (
                            pagedList.map((item) => (
                                <tr key={item.settlementId}>
                                    <td>ST-{String(item.settlementId).padStart(4, "0")}</td>
                                    <td>{item.startDate?.slice(0, 10)}</td>
                                    <td>{item.endDate?.slice(0, 10)}</td>
                                    <td className="num">{formatMoney(item.totalSales)}</td>
                                    <td className="num">{formatMoney(item.totalPurchase)}</td>
                                    <td className="num">{formatMoney(item.totalReceivable)}</td>
                                    <td className="num">{formatMoney(item.totalPayable)}</td>
                                    <td className="num">{formatMoney(item.grossProfit)}</td>
                                    <td>{item.profitRate ?? 0}%</td>
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
