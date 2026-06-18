package com.erp.backend.sales.vo;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class PurchaseInvoiceVO {

    private Integer purchaseInvoiceId; // 매입청구 ID (PK)
    private Integer poId; // 발주 ID (FK)
    private Integer supplierId; // 공급처 ID
    private String supplierName; // 공급처명
    private LocalDate issueDate; // 매입청구 발행일
    private BigDecimal totalAmount; // 총 매입금액
    private String status; // 매입청구 상태
    private LocalDate createdAt; // 생성일자

}