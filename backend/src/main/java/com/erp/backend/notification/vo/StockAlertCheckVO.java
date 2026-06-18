package com.erp.backend.notification.vo;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StockAlertCheckVO {
    private Integer productId;
    private String productName;
    private Integer safetyQty;
    private Integer availableQty;
}