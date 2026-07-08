package com.erp.backend.settlement.vo;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class AccountReceivableVO {

    private Integer arId; // 매출채권 ID (PK)
    private Integer customerId; // 거래처 ID
    private String customerName; // 거래처명
    private Integer salesInvoiceId; // 매출청구 ID (FK)
    private BigDecimal totalAmount; // 총 청구금액
    private BigDecimal paidAmount; // 입금된 금액
    private BigDecimal remainAmount; // 남은 미수금
    private LocalDate dueDate; // 입금 예정일
    private String status; // 미수금 상태
    private LocalDate createdAt; // 생성일자
    private BigDecimal monthSalesAmount; // 당월 매출액
    private BigDecimal creditLimit; // 여신한도
    private BigDecimal creditBalance; // 여신잔액
    
}