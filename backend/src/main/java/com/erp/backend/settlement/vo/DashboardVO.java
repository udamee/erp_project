package com.erp.backend.settlement.vo;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class DashboardVO {

    private BigDecimal totalSales;
    private BigDecimal totalPurchase;
    private BigDecimal totalReceivable;
    private BigDecimal totalPayable;
    private BigDecimal grossProfit;
    private BigDecimal profitRate;
}
