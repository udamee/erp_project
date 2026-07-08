package com.erp.backend.settlement.vo;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class PayablePaymentVO {

    private Integer payablePaymentId;
    private Integer apId;
    private Integer supplierId;
    private String supplierName;
    private LocalDate paymentDate;
    private BigDecimal paymentAmount;
    private String paymentType;
    private Integer createdBy;
    private String createdByName;
    private LocalDate createdAt;

}