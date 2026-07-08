package com.erp.backend.inventory.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class PurchaseOrderDetailResponseDto {
    // 발주 품목 응답

    private Long poDetailId;
    private Long productId;
    private String productName;
    private String productCode;
    private String unit;
    private Integer orderQty;
    private BigDecimal unitPrice;
    private BigDecimal amount;
}
