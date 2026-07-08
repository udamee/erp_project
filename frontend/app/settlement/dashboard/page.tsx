"use client";

import { useEffect, useState } from "react";
import ErpLayout from "@/components/ErpLayout";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";
import {
    DashboardSummary,
    SalesChartItem,
    settlementDashboardApi
} from "@/lib/api";
import "../settlement.css";

export default function SalesDashboard() {
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [salesChart, setSalesChart] = useState<SalesChartItem[]>([]);
    const [customerTop5, setCustomerTop5] = useState<SalesChartItem[]>([]);
    const [productTop5, setProductTop5] = useState<SalesChartItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
        settlementDashboardApi.summary(),
        settlementDashboardApi.salesChart(),
        settlementDashboardApi.customerTop5(),
        settlementDashboardApi.productTop5(),
    ])
    .then(([summaryData, salesChartData, customerTop5Data, productTop5Data]) => {
        setSummary(summaryData);
        setSalesChart(salesChartData ?? []);
        setCustomerTop5(customerTop5Data ?? []);
        setProductTop5(productTop5Data ?? []);
    })
    .catch((err) => {
        console.error("대시보드 조회 실패", err);
    })
    .finally(() => {
        setLoading(false);
    });
}, []);

const formatMoney = (value?: number) => {
    return `${(value ?? 0).toLocaleString()}원`;
};

return (
    <ErpLayout title="매출 대시보드">
        {loading ? (
            <div className="erp-card">불러오는 중...</div>
            ) : (
                <>
                    <div className="settlement-stats">
                        <div className="erp-stat">
                            <p>당월 총 매출액</p>
                            <strong>{formatMoney(summary?.totalSales)}</strong>
                        </div>

                        <div className="erp-stat success">
                            <p>당월 총 매입액</p>
                            <strong>{formatMoney(summary?.totalPurchase)}</strong>
                        </div>

                        <div className="erp-stat warning">
                            <p>현재 총 미수금</p>
                            <strong>{formatMoney(summary?.totalReceivable)}</strong>
                        </div>

                        <div className="erp-stat danger">
                            <p>현재 총 미지급금</p>
                            <strong>{formatMoney(summary?.totalPayable)}</strong>
                        </div>

                        <div className="erp-stat success">
                            <p>매출 총이익</p>
                            <strong>{formatMoney(summary?.grossProfit)}</strong>
                        </div>

                        <div className="erp-stat">
                            <p>이익률</p>
                            <strong>{summary?.profitRate ?? 0}%</strong>
                        </div>
                    </div>

                    <div className="erp-card" style={{ minHeight: "300px" }}>
                        <h3>월간 매출 추이</h3>

                        {salesChart.length === 0 ? (
                            <p style={{ textAlign: "center", color: "var(--erp-text-muted)" }}>
                                데이터가 없습니다.
                            </p>
                        ) : (
                            <div style={{ width: "100%", height: 300 }}>
                                <ResponsiveContainer>
                                    <LineChart data={salesChart}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="period" />
                                        <YAxis
                                            width={80}
                                            tickFormatter={(value) =>
                                                `${Math.round(Number(value) / 10000)}만`
                                            }
                                        />
                                        <Tooltip
                                            formatter={(value) => [
                                                `${Number(value).toLocaleString()}원`,
                                                "매출액",
                                            ]}
                                            labelFormatter={(label) => `${label}`}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="salesAmount"
                                            strokeWidth={2}
                                            dot={{ r: 4 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "16px",
                        }}
                    >
                        <div className="erp-card" style={{ minHeight: "260px" }}>
                            <h3>거래처별 매출 TOP 5</h3>

                            <div style={{ width: "100%", height: 260 }}>
                                <ResponsiveContainer>
                                    <BarChart data={customerTop5} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            type="number"
                                            tickFormatter={(value) =>
                                                `${Math.round(Number(value) / 10000)}만`
                                            }
                                        />
                                        <YAxis type="category" dataKey="customerName" width={100} />
                                        <Tooltip
                                            formatter={(value) => [
                                                `${Number(value).toLocaleString()}원`,
                                                "매출액",
                                            ]}
                                        />
                                        <Bar
                                            dataKey="salesAmount"
                                            fill="var(--erp-primary)"
                                            radius={[0, 4, 4, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="erp-card" style={{ minHeight: "260px" }}>
                            <h3>품목별 매출 TOP 5</h3>

                            <div style={{ width: "100%", height: 260 }}>
                                <ResponsiveContainer>
                                    <BarChart data={productTop5} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            type="number"
                                            tickFormatter={(value) =>
                                                `${Math.round(Number(value) / 10000)}만`
                                            }
                                        />
                                        <YAxis type="category" dataKey="productName" width={120} />
                                        <Tooltip
                                            formatter={(value) => [
                                                `${Number(value).toLocaleString()}원`,
                                                "매출액",
                                            ]}
                                        />
                                        <Bar
                                            dataKey="salesAmount"
                                            fill="var(--erp-primary)"
                                            radius={[0, 4, 4, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </ErpLayout>
    );
}