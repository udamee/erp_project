"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ErpLayout from "@/components/ErpLayout";
import { customerApi, MedicalInst, BusinessStatus } from "@/lib/api";

const SIDO_LIST = [
  "서울특별시", "부산광역시", "대구광역시", "인천광역시", "광주광역시",
  "대전광역시", "울산광역시", "세종특별자치시", "경기도", "강원특별자치도",
  "충청북도", "충청남도", "전북특별자치도", "전라남도", "경상북도",
  "경상남도", "제주특별자치도",
];

export default function CustomerNewPage() {
  const router = useRouter();

  // 검색 영역
  const [searchType, setSearchType] = useState<"PHARMACY" | "HOSPITAL">("PHARMACY");
  const [sido, setSido] = useState("서울특별시");
  const [searchName, setSearchName] = useState("");
  const [searchResults, setSearchResults] = useState<MedicalInst[]>([]);
  const [searching, setSearching] = useState(false);

  // 등록 폼
  const [form, setForm] = useState({
    customerName: "",
    customerType: "PHARMACY" as "PHARMACY" | "HOSPITAL",
    businessNo: "",
    creditLimit: "",
    phone: "",
    address: "",
  });

  // 사업자번호 상태조회
  const [bizStatus, setBizStatus] = useState<BusinessStatus | null>(null);
  const [bizMessage, setBizMessage] = useState("");
  const [checking, setChecking] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // ----- 약국·병원 검색 -----
  const handleSearch = async () => {
    setSearching(true);
    setError("");
    try {
      const data =
        searchType === "PHARMACY"
          ? await customerApi.searchPharmacy(sido, undefined, searchName || undefined)
          : await customerApi.searchHospital(sido, undefined, searchName || undefined);
      setSearchResults(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "검색에 실패했습니다.");
    } finally {
      setSearching(false);
    }
  };

  // ----- 검색 결과 선택 → 폼 자동 채움 -----
  const handleSelect = (inst: MedicalInst) => {
    setForm((prev) => ({
      ...prev,
      customerName: inst.name,
      customerType: inst.type,
      phone: inst.phone ?? "",
      address: inst.address ?? "",
    }));
    // 거래처가 바뀌면 이전 사업자 확인 결과 초기화
    setBizStatus(null);
    setBizMessage("");
  };

  // ----- 사업자번호 상태조회 -----
  const handleCheckBusiness = async () => {
    if (!form.businessNo.trim()) {
      setBizMessage("사업자번호를 입력해주세요.");
      setBizStatus(null);
      return;
    }
    setChecking(true);
    setBizMessage("");
    try {
      const status = await customerApi.checkBusiness(form.businessNo);
      setBizStatus(status);
      if (!status.registered) {
        setBizMessage("국세청에 등록되지 않은 사업자번호입니다.");
      } else if (status.valid) {
        setBizMessage(`정상 영업 중 (${status.bStt} / ${status.taxType})`);
      } else {
        setBizMessage(`거래 불가 (${status.bStt})`);
      }
    } catch (e) {
      setBizMessage(e instanceof Error ? e.message : "상태조회에 실패했습니다.");
      setBizStatus(null);
    } finally {
      setChecking(false);
    }
  };

  // ----- 거래처 등록 -----
  const handleSubmit = async () => {
    if (!form.customerName.trim()) {
      setError("거래처명을 입력해주세요.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await customerApi.create({
        customerName: form.customerName,
        customerType: form.customerType,
        businessNo: form.businessNo || undefined,
        creditLimit: form.creditLimit ? Number(form.creditLimit) : undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
      });
      router.push("/customers");
    } catch (e) {
      setError(e instanceof Error ? e.message : "거래처 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ErpLayout title="거래처 등록">
      {error && <div className="erp-error">{error}</div>}

      <div className="erp-form-grid">
        {/* 왼쪽: 약국·병원 검색 */}
        <section className="erp-card">
          <h2 className="erp-card-title">약국 · 병의원 검색</h2>
          <p className="erp-card-desc">
            공공데이터에서 기관을 검색해 선택하면 정보가 자동으로 채워집니다.
          </p>

          <div className="erp-segment">
            <button
              className={`erp-segment-btn ${searchType === "PHARMACY" ? "active" : ""}`}
              onClick={() => setSearchType("PHARMACY")}
            >
              약국
            </button>
            <button
              className={`erp-segment-btn ${searchType === "HOSPITAL" ? "active" : ""}`}
              onClick={() => setSearchType("HOSPITAL")}
            >
              병의원
            </button>
          </div>

          <div className="erp-field-row">
            <select className="erp-input" value={sido} onChange={(e) => setSido(e.target.value)}>
              {SIDO_LIST.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <input
              className="erp-input"
              placeholder="기관명 (선택)"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <button className="erp-btn-primary" onClick={handleSearch} disabled={searching}>
              {searching ? "검색 중..." : "검색"}
            </button>
          </div>

          <div className="erp-search-results">
            {searchResults.length === 0 ? (
              <div className="erp-empty-sm">검색 결과가 여기에 표시됩니다.</div>
            ) : (
              searchResults.map((inst, idx) => (
                <button
                  key={`${inst.name}-${idx}`}
                  className="erp-result-item"
                  onClick={() => handleSelect(inst)}
                >
                  <div className="erp-result-name">{inst.name}</div>
                  <div className="erp-result-sub">{inst.address}</div>
                  <div className="erp-result-sub">{inst.phone}</div>
                </button>
              ))
            )}
          </div>
        </section>

        {/* 오른쪽: 거래처 등록 폼 */}
        <section className="erp-card">
          <h2 className="erp-card-title">거래처 정보</h2>

          <label className="erp-label">거래처명 *</label>
          <input
            className="erp-input"
            value={form.customerName}
            onChange={(e) => setForm({ ...form, customerName: e.target.value })}
            placeholder="검색에서 선택하거나 직접 입력"
          />

          <label className="erp-label">유형 *</label>
          <select
            className="erp-input"
            value={form.customerType}
            onChange={(e) =>
              setForm({ ...form, customerType: e.target.value as "PHARMACY" | "HOSPITAL" })
            }
          >
            <option value="PHARMACY">약국</option>
            <option value="HOSPITAL">병의원</option>
          </select>

          <label className="erp-label">사업자번호</label>
          <div className="erp-field-row">
            <input
              className="erp-input"
              value={form.businessNo}
              onChange={(e) => {
                setForm({ ...form, businessNo: e.target.value });
                setBizStatus(null);
                setBizMessage("");
              }}
              placeholder="- 없이 10자리"
            />
            <button className="erp-btn" onClick={handleCheckBusiness} disabled={checking}>
              {checking ? "조회 중..." : "상태조회"}
            </button>
          </div>
          {bizMessage && (
            <div className={`erp-biz-status ${bizStatus?.valid ? "ok" : "warn"}`}>
              {bizMessage}
            </div>
          )}

          <label className="erp-label">연락처</label>
          <input
            className="erp-input"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />

          <label className="erp-label">주소</label>
          <input
            className="erp-input"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />

          <label className="erp-label">여신한도 (원)</label>
          <input
            className="erp-input"
            type="number"
            value={form.creditLimit}
            onChange={(e) => setForm({ ...form, creditLimit: e.target.value })}
            placeholder="0"
          />

          <div className="erp-form-actions">
            <button className="erp-btn" onClick={() => router.push("/customers")}>
              취소
            </button>
            <button className="erp-btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "등록 중..." : "거래처 등록"}
            </button>
          </div>
        </section>
      </div>
    </ErpLayout>
  );
}