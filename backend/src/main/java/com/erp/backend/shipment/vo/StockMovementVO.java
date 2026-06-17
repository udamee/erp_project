package com.erp.backend.shipment.vo;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Setter
public class StockMovementVO {
    private Integer movementId;
    private Integer inventoryLotId;
    private String movementType;
    private Integer quantity;
    private Integer beforeQty;
    private Integer afterQty;
    private String sourceType;
    private Integer sourceId;
    private Integer createdBy;
    private LocalDateTime createdAt;
    private String reason;
    private Integer employeeId;
    private LocalTime updatedAt;
}
