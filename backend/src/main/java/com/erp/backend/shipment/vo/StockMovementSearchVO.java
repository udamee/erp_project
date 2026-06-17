package com.erp.backend.shipment.vo;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
@Setter
@Getter
public class StockMovementSearchVO {
    private Integer productId;
    private String productName;
    private Integer inventoryLotId;
    private String lotNo;
    private Integer shipmentId;
    private Integer receivingId;
    private Integer movementId;
    private String sourceType;
    private Integer sourceId;
    private BigDecimal beforeQty;
    private BigDecimal qty;
    private BigDecimal afterQty;
    private LocalDateTime createdAt;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
}
