package com.erp.backend.refundItem.vo;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class ReturnedItemRequestVO {
    private Integer returnId;
    private Integer returnGroupId;
    private Integer customerId;
    private Integer salesOrderId;
    private Integer productId;
    private Integer inventoryLotId;
    private Integer returnQty;
    private String reason;
    private String status;
    private Integer createdBy;
    private LocalDateTime createdAt;
    private Integer approvedBy;
    private LocalDateTime approvedAt;
    private LocalDateTime completedAt;
    private String rejectReason;
    private Integer soDetailId;
    private Integer shipmentDetailId;
}
