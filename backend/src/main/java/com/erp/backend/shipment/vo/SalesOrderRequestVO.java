package com.erp.backend.shipment.vo;

import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class SalesOrderRequestVO {
    private Integer soId;
    private Integer customerId;
    private Integer requestEmpId;
    private Integer approveEmpId;
    private LocalDateTime orderDate;
    private LocalDateTime approveDate;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer soDetailId;
    private Integer orderQty;
    private Integer productId;
    private String productName;
    private Integer safetyQty;
    private String makerName;
    private Integer availableQty;
}
