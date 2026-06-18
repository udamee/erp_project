package com.erp.backend.sales.dto;

import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
public class SalesResponseDto {

    private Integer salesInvoiceId; // 매출청구 ID
    private Integer customerId; // 거래처 ID
    private Integer soId; // 수주 ID
    private LocalDate issueDate; // 청구일자
    private BigDecimal totalAmount; // 총 금액
    private String status; // 상태
    private LocalDate createdAt; // 생성일

}