package com.erp.backend.sales.vo;

import lombok.Data;

import java.math.BigDecimal;
import java.math.BigInteger;

@Data
public class SalesOrderDetailVO {
    Integer soId;
    Integer soDetailId;
    Integer productId;
    Integer orderQty;
    BigDecimal unitPrice;
    BigDecimal amount;
    String productName;
}
