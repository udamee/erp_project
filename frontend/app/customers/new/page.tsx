"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Row, Col, Card, Segmented, Select, Input, Button,
  Form, InputNumber, Alert, Space, message,
} from "antd";
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
    creditLimit: 0 as number | null,
    phone: "",
    address: "",
  });

  // 사업자번호 상태조회
  const [bizStatus, setBizStatus] = useState<BusinessStatus | null>(null);
  const [bizMessage, setBizMessage] = useState("");
  const [checking, setChecking] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // ----- 약국·병원 검색 -----
  const handleSearch = async () => {
    setSearching(true);
    try {
      const data =
        searchType === "PHARMACY"
          ? await customerApi.searchPharmacy(sido, undefined, searchName || undefined)
          : await customerApi.searchHospital(sido, undefined, searchName || undefined);
      setSearchResults(data);
    } catch (e) {
      message.error(e instanceof Error ? e.message : "검색에 실패했습니다.");
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
      message.warning("거래처명을 입력해주세요.");
      return;
    }
    // 사업자번호 필수
    if (!form.businessNo.trim()) {
      message.warning("사업자번호를 입력해주세요.");
      return;
    }
    // 상태조회 통과 필수 (선택적으로)
    if (!bizStatus || !bizStatus.valid) {
      message.warning("사업자번호 상태조회를 통과해야 등록할 수 있습니다.");
      return;
    }
    setSubmitting(true);
    try {
      await customerApi.create({
        customerName: form.customerName,
        customerType: form.customerType,
        businessNo: form.businessNo || undefined,
        creditLimit: form.creditLimit ?? undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
      });
      message.success("거래처가 등록되었습니다.");
      router.push("/customers");
    } catch (e) {
      message.error(e instanceof Error ? e.message : "거래처 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ErpLayout title="거래처 등록">
      <Row gutter={20}>
        {/* 왼쪽: 약국·병원 검색 */}
        <Col xs={24} lg={12}>
          <Card title="약국 · 병의원 검색">
            <p style={{ color: "#8a9690", marginTop: 0 }}>
              공공데이터에서 기관을 검색해 선택하면 정보가 자동으로 채워집니다.
            </p>

            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              <Segmented
                block
                value={searchType}
                onChange={(v) => setSearchType(v as "PHARMACY" | "HOSPITAL")}
                options={[
                  { label: "약국", value: "PHARMACY" },
                  { label: "병의원", value: "HOSPITAL" },
                ]}
              />

              <Space.Compact style={{ width: "100%" }}>
                <Select
                  value={sido}
                  onChange={setSido}
                  options={SIDO_LIST.map((s) => ({ label: s, value: s }))}
                  style={{ width: 160 }}
                />
                <Input
                  placeholder="기관명 (선택)"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  onPressEnter={handleSearch}
                />
                <Button type="primary" loading={searching} onClick={handleSearch}>
                  검색
                </Button>
              </Space.Compact>

              <div
                style={{
                  maxHeight: 420,
                  overflowY: "auto",
                  border: "1px solid #f0f0f0",
                  borderRadius: 8,
                }}
              >
                {searchResults.length === 0 ? (
                  <div style={{ textAlign: "center", color: "#aab4af", padding: 28, fontSize: 13 }}>
                    검색 결과가 여기에 표시됩니다.
                  </div>
                ) : (
                  searchResults.map((inst, idx) => (
                    <div
                      key={`${inst.name}-${idx}`}
                      onClick={() => handleSelect(inst)}
                      style={{
                        cursor: "pointer",
                        padding: "12px 14px",
                        borderBottom: idx === searchResults.length - 1 ? "none" : "1px solid #f0f4f2",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f6faf8")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <div style={{ fontWeight: 600 }}>{inst.name}</div>
                      <div style={{ fontSize: 12, color: "#8a9690" }}>{inst.address}</div>
                      <div style={{ fontSize: 12, color: "#8a9690" }}>{inst.phone}</div>
                    </div>
                  ))
                )}
              </div>
            </Space>
          </Card>
        </Col>

        {/* 오른쪽: 거래처 등록 폼 */}
        <Col xs={24} lg={12}>
          <Card title="거래처 정보">
            <Form layout="vertical">
              <Form.Item label="거래처명" required>
                <Input
                  value={form.customerName}
                  onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  placeholder="검색에서 선택하거나 직접 입력"
                />
              </Form.Item>

              <Form.Item label="유형" required>
                <Select
                  value={form.customerType}
                  onChange={(v) => setForm({ ...form, customerType: v })}
                  options={[
                    { label: "약국", value: "PHARMACY" },
                    { label: "병의원", value: "HOSPITAL" },
                  ]}
                />
              </Form.Item>

              <Form.Item label="사업자번호">
                <Space.Compact style={{ width: "100%" }}>
                  <Input
                    value={form.businessNo}
                    onChange={(e) => {
                      setForm({ ...form, businessNo: e.target.value });
                      setBizStatus(null);
                      setBizMessage("");
                    }}
                    placeholder="- 없이 10자리"
                  />
                  <Button loading={checking} onClick={handleCheckBusiness}>
                    상태조회
                  </Button>
                </Space.Compact>
                {bizMessage && (
                  <Alert
                    style={{ marginTop: 8 }}
                    type={bizStatus?.valid ? "success" : "warning"}
                    title={bizMessage}
                    showIcon
                  />
                )}
              </Form.Item>

              <Form.Item label="연락처">
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </Form.Item>

              <Form.Item label="주소">
                <Input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </Form.Item>

              <Form.Item label="여신한도 (원)">
                <InputNumber
                  style={{ width: "100%" }}
                  value={form.creditLimit}
                  onChange={(v) => setForm({ ...form, creditLimit: v })}
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(v) => Number((v ?? "").replace(/,/g, ""))}
                  min={0}
                />
              </Form.Item>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <Button onClick={() => router.push("/customers")}>취소</Button>
                <Button type="primary" loading={submitting} onClick={handleSubmit}>
                  거래처 등록
                </Button>
              </div>
            </Form>
          </Card>
        </Col>
      </Row>
    </ErpLayout>
  );
}