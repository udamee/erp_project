package com.erp.backend.shipment.vo;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProductStockVO {
    private int productId;
    private String productCode;
    private String productName;
    private int availableQty;
    private int safetyQty;
    private int shippableQty;
    private String stockStatus;
}