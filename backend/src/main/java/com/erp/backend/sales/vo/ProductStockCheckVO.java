package com.erp.backend.sales.vo;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProductStockCheckVO {
    private Integer productId;
    private String productName;
    private Integer availableQty;
    private Integer safetyQty;
    private Integer shippableQty;
}
