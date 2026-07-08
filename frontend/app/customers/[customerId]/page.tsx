"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Card, Form, Input, Select, InputNumber, Button, Alert, Space, Spin, message,
} from "antd";
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
    creditLimit: 0 as number | null,
    phone: "",
    address: "",
  });
  const [receivable, setReceivable] = useState(0);

  const [bizStatus, setBizStatus] = useState<BusinessStatus | null>(null);
  const [bizMessage, setBizMessage] = useState("");
  const [checking, setChecking] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const c = await customerApi.detail(customerId);
        setForm({
          customerName: c.customerName,
          customerType: c.customerType,
          businessNo: c.businessNo ?? "",
          creditLimit: c.creditLimit ?? 0,
          phone: c.phone ?? "",
          address: c.address ?? "",
        });
        setReceivable(c.receivableBalance ?? 0);
      } catch (e) {
        message.error(e instanceof Error ? e.message : "거래처 정보를 불러오지 못했습니다.");
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
      message.warning("거래처명을 입력해주세요.");
      return;
    }
    setSaving(true);
    try {
      await customerApi.update(customerId, {
        customerName: form.customerName,
        customerType: form.customerType,
        businessNo: form.businessNo || undefined,
        creditLimit: form.creditLimit ?? undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
      });
      message.success("거래처가 수정되었습니다.");
      router.push("/customers");
    } catch (e) {
      message.error(e instanceof Error ? e.message : "거래처 수정에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ErpLayout title="거래처 상세">
        <div style={{ textAlign: "center", padding: 48 }}>
          <Spin />
        </div>
      </ErpLayout>
    );
  }

  return (
    <ErpLayout title="거래처 상세 / 수정">
      <Card style={{ maxWidth: 560 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            color: "#8a9690",
            fontSize: 13,
            paddingBottom: 14,
            marginBottom: 8,
            borderBottom: "1px solid #eef2f0",
          }}
        >
          <span>거래처 번호 #{customerId}</span>
          <span>미수금 잔액: {receivable.toLocaleString()}원</span>
        </div>

        <Form layout="vertical">
          <Form.Item label="거래처명" required>
            <Input
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
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
            <Button onClick={() => router.push("/customers")}>목록으로</Button>
            <Button type="primary" loading={saving} onClick={handleSave}>
              수정 저장
            </Button>
          </div>
        </Form>
      </Card>
    </ErpLayout>
  );
}