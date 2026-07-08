"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ErpLayout from "@/components/ErpLayout";
import { settlementApi, userStorage } from "@/lib/api";
import "../../settlement.css";

export default function SettlementNewPage() {
  const router = useRouter();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleSubmit = () => {
    if (!startDate || !endDate) {
      alert("정산 시작일과 종료일을 입력해주세요.");
      return;
    }

    if (startDate > endDate) {
      alert("시작일은 종료일보다 늦을 수 없습니다.");
      return;
    }

    const user = userStorage.get();

    if (!user) {
      alert("로그인 사용자 정보를 찾을 수 없습니다.");
      return;
    }

    const body = {
      startDate,
      endDate,
      createdBy: user.empId,
    };

    settlementApi
      .create(body)
      .then(() => {
        alert("손익정산이 등록되었습니다.");
        router.push("/settlement/settlements");
      })
      .catch((err) => {
        console.error(err);
        alert(err.message || "손익정산 등록 중 오류가 발생했습니다.");
      });
  };

  return (
    <ErpLayout title="손익정산 등록">
      <div className="erp-card">
        <h3>정산 기간 선택</h3>

        <div
          style={{
            marginBottom: 16,
            padding: 12,
            background: "#f8f9fa",
            border: "1px solid #ddd",
            borderRadius: 6,
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          <div>
            선택한 기간의 매출청구, 매입청구, 미수금, 미지급금 데이터를
            기준으로 손익정산이 생성됩니다.
          </div>
          <strong>정산 기준: 생성일 기준</strong>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <p style={{ fontSize: 13, color: "var(--erp-text-muted)" }}>
              시작일
            </p>
            <input
              className="erp-input"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <p style={{ fontSize: 13, color: "var(--erp-text-muted)" }}>
              종료일
            </p>
            <input
              className="erp-input"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>
        </div>

        <div className="erp-page-actions">
          <button
            className="erp-btn"
            onClick={() => router.push("/settlement/settlements")}
          >
            목록
          </button>

          <button className="erp-btn primary" onClick={handleSubmit}>
            손익정산 등록
          </button>
        </div>
      </div>
    </ErpLayout>
  );
}