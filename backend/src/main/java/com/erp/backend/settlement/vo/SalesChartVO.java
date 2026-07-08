package com.erp.backend.settlement.vo;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class SalesChartVO {
    private String period;
    private Integer customerId;
    private String customerName;
    private Integer productId;
    private String productName;
    private BigDecimal salesAmount;
    private BigDecimal salesRatio;
}
