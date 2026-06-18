package com.erp.backend.sales.vo;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class SalesInvoiceVO {

    private Integer salesInvoiceId; // 매출청구 ID (PK)
    private Integer soId; // 수주번호 Sales Order
    private Integer customerId; // 거래처 ID
    private String customerName; // 거래처명
    private LocalDate issueDate; // 청구서 발행일
    private BigDecimal totalAmount; // 총 청구금액
    private String status; // 청구 상태
    private LocalDate createdAt; // 생성일자

}