package com.erp.backend.sales.vo;

import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;

@Getter
@Setter
public class SalesOrderAmountCheckVO {
    private int soId;
    private int customerId;
    private String status;
    private BigDecimal totalAmount;
    private BigDecimal detailAmountSum;
    private String headerAmountMatched;
    private int detailLineCount;
    private BigDecimal detailCalculatedAmountSum;
    private String detailAmountMatched;

    public boolean amountMatched(){
        return "Y".matches(headerAmountMatched) && "Y".matches(detailAmountMatched);
    }
}
