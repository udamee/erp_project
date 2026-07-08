package com.erp.backend.shipment.vo;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Setter
@Getter
public class ShipmentResultVO {
    private Integer shipmentId;
    private Integer soId;
    private Integer soDetailId;
    private String productName;
    private String lotNo;
    private Integer shipmentDetailId;
    private Integer inventoryLotId;
    private String beforeQty;
    private String afterQty;
    private LocalDateTime shipmentDate;
    private Integer shippedQty;
    private Integer qty;
    private LocalDateTime createdAt;
    private String createdBy;
}
