"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ErpLayout from "@/components/ErpLayout";
import { customerApi, Customer } from "@/lib/api";

const TYPE_TABS = [
  { key: "", label: "전체" },
  { key: "PHARMACY", label: "약국" },
  { key: "HOSPITAL", label: "병의원" },
];

const TYPE_LABEL: Record<string, string> = {
  PHARMACY: "약국",
  HOSPITAL: "병의원",
};

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [typeTab, setTypeTab] = useState("");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadCustomers = async (type: string, kw: string) => {
    setLoading(true);
    setError("");
    try {
      const data = await customerApi.list(type || undefined, "ACTIVE", kw || undefined);
      setCustomers(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "거래처 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers(typeTab, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeTab]);

  const handleSearch = () => loadCustomers(typeTab, keyword);

  return (
    <ErpLayout title="거래처 관리">
      <div className="erp-toolbar">
        <div className="erp-tabs">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.key}
              className={`erp-tab ${typeTab === tab.key ? "active" : ""}`}
              onClick={() => setTypeTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button className="erp-btn-primary" onClick={() => router.push("/customers/new")}>
          + 거래처 등록
        </button>
      </div>

      <div className="erp-search-bar">
        <input
          className="erp-input"
          placeholder="거래처명 검색"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <button className="erp-btn" onClick={handleSearch}>
          검색
        </button>
      </div>

      {error && <div className="erp-error">{error}</div>}

      {loading ? (
        <div className="erp-empty">불러오는 중...</div>
      ) : customers.length === 0 ? (
        <div className="erp-empty">등록된 거래처가 없습니다.</div>
      ) : (
        <table className="erp-table">
          <thead>
            <tr>
              <th>거래처명</th>
              <th>유형</th>
              <th>사업자번호</th>
              <th>연락처</th>
              <th>주소</th>
              <th>여신한도</th>
              <th>미수금</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr
                key={c.customerId}
                className="erp-row-link"
                onClick={() => router.push(`/customers/${c.customerId}`)}
              >
                <td>{c.customerName}</td>
                <td>{TYPE_LABEL[c.customerType] ?? c.customerType}</td>
                <td>{c.businessNo ?? "-"}</td>
                <td>{c.phone ?? "-"}</td>
                <td className="erp-cell-ellipsis">{c.address ?? "-"}</td>
                <td className="erp-cell-num">{c.creditLimit.toLocaleString()}원</td>
                <td className="erp-cell-num">{c.receivableBalance.toLocaleString()}원</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </ErpLayout>
  );
}