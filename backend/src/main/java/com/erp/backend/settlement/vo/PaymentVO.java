package com.erp.backend.settlement.vo;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class PaymentVO {

    private Integer paymentId; // 입금 ID (PK)
    private Integer arId; // 매출채권 ID (FK)
    private Integer customerId; // 거래처 ID
    private String customerName; // 거래처명
    private LocalDate paymentDate; // 입금일자
    private BigDecimal paymentAmount; // 입금금액
    private String paymentType; // 입금 유형
    private Integer createdBy; // 생성자 ID
    private String createdByName; // 생성자 이름
    private LocalDate createdAt; // 생성일자

}