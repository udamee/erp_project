package com.erp.backend.notification.vo;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class AlertVO {
    private Integer alertId;
    private Integer productId;
    private Integer inventoryLotId;
    private String alertType;
    private String message;
    private String isRead;
    private LocalDateTime createdAt;

    private String productName;
    private String lotNo;
}