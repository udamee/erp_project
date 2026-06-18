package com.erp.backend.sales.vo;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class AccountPayableVO {

    private Integer apId; // 매입채무 ID (PK)
    private Integer supplierId; // 공급처 ID
    private String supplierName; // 공급처명
    private Integer purchaseInvoiceId; // 매입청구 ID (FK)
    private BigDecimal totalAmount; // 총 지급금액
    private BigDecimal paidAmount; // 지급 완료 금액
    private BigDecimal remainAmount; // 남은 미지급금
    private LocalDate dueDate; // 지급 예정일
    private String status; // 지급 상태
    private LocalDate createdAt; // 생성일자

}