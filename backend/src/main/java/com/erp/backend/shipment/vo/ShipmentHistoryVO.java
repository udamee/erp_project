package com.erp.backend.shipment.vo;

import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
public class ShipmentHistoryVO {
    private Integer salesOrderId;
    private Integer shipmentId;
    private Integer shippedQty;
    private LocalDateTime shipmentDate;
    private Integer productId;
    private Integer inventoryLotId;
    private String lotNo;
    private String productName;

    private String movementType;
    private String sourceType;
    private BigDecimal beforeQty;
    private BigDecimal movementQty;
    private BigDecimal afterQty;
}
