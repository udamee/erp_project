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
    private String productCode;
    private Integer inventoryLotId;
    private String lotNo;
    private Integer shipmentId;
    private Integer receivingId;
    private Integer movementId;
    private String movementType;
    private String sourceType;
    private Integer sourceId;
    private BigDecimal beforeQty;
    private BigDecimal qty;
    private BigDecimal afterQty;
    private String location;
    private String status;
    private LocalDateTime expiryDate;
    private LocalDateTime createdAt;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private int daysLeft;
}
