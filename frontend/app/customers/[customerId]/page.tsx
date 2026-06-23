"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import ErpLayout from "@/components/ErpLayout";
import { customerApi, BusinessStatus } from "@/lib/api";

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = Number(params.customerId);

  const [form, setForm] = useState({
    customerName: "",
    customerType: "PHARMACY" as "PHARMACY" | "HOSPITAL",
    businessNo: "",
    creditLimit: "",
    phone: "",
    address: "",
  });
  const [receivable, setReceivable] = useState(0);

  const [bizStatus, setBizStatus] = useState<BusinessStatus | null>(null);
  const [bizMessage, setBizMessage] = useState("");
  const [checking, setChecking] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const c = await customerApi.detail(customerId);
        setForm({
          customerName: c.customerName,
          customerType: c.customerType,
          businessNo: c.businessNo ?? "",
          creditLimit: String(c.creditLimit ?? 0),
          phone: c.phone ?? "",
          address: c.address ?? "",
        });
        setReceivable(c.receivableBalance ?? 0);
      } catch (e) {
        setError(e instanceof Error ? e.message : "거래처 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, [customerId]);

  const handleCheckBusiness = async () => {
    if (!form.businessNo.trim()) {
      setBizMessage("사업자번호를 입력해주세요.");
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
    } finally {
      setChecking(false);
    }
  };

  const handleSave = async () => {
    if (!form.customerName.trim()) {
      setError("거래처명을 입력해주세요.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await customerApi.update(customerId, {
        customerName: form.customerName,
        customerType: form.customerType,
        businessNo: form.businessNo || undefined,
        creditLimit: form.creditLimit ? Number(form.creditLimit) : undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
      });
      router.push("/customers");
    } catch (e) {
      setError(e instanceof Error ? e.message : "거래처 수정에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ErpLayout title="거래처 상세">
        <div className="erp-empty">불러오는 중...</div>
      </ErpLayout>
    );
  }

  return (
    <ErpLayout title="거래처 상세 / 수정">
      {error && <div className="erp-error">{error}</div>}

      <section className="erp-card erp-card-narrow">
        <div className="erp-detail-meta">
          <span>거래처 번호 #{customerId}</span>
          <span>미수금 잔액: {receivable.toLocaleString()}원</span>
        </div>

        <label className="erp-label">거래처명 *</label>
        <input
          className="erp-input"
          value={form.customerName}
          onChange={(e) => setForm({ ...form, customerName: e.target.value })}
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
          <div className={`erp-biz-status ${bizStatus?.valid ? "ok" : "warn"}`}>{bizMessage}</div>
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
        />

        <div className="erp-form-actions">
          <button className="erp-btn" onClick={() => router.push("/customers")}>
            목록으로
          </button>
          <button className="erp-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "저장 중..." : "수정 저장"}
          </button>
        </div>
      </section>
    </ErpLayout>
  );
}