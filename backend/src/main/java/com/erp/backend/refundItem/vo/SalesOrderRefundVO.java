package com.erp.backend.refundItem.vo;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class SalesOrderRefundVO {
    private Integer salesOrderId;
    private Integer soDetailId;
    private Integer orderQty;
    private BigDecimal unitPrice;
    private BigDecimal totalAmount;
}
