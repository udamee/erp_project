package com.erp.backend.refundItem.vo;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class ReturnedItemVO {
    private Integer returnId;
    private Integer customerId;
    private Integer shipmentDetailId;
    private Integer salesOrderId;
    private Integer productId;
    private Integer inventoryLotId;
    private Integer outQty;
    private Integer returnedQty;
    private String reason;
    private String status;
    private Integer createdBy;
    private LocalDateTime createdAt;
    private Integer approvedBy;
    private LocalDateTime approvedAt;
    private LocalDateTime completedAt;
    private String rejectReason;
}
