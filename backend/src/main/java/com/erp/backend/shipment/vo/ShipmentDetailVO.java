package com.erp.backend.shipment.vo;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class ShipmentDetailVO {
    private Integer shipmentDetailId;
    private Integer shipmentId;
    private Integer salesOrderId;
    private Integer salesOrderDetailId;
    private String customerName;
    private LocalDateTime orderDate;
    private LocalDateTime shipmentDate;
    private Integer shippedEmpId;
    private String employeeName;
    private String status;
    private String productName;
    private Integer inventoryLotId;
    private String lotNo;
    private LocalDateTime expiryDate;
    private Integer shippedQty;
    private Integer productId;
}
