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
    private String alertLevel;
    private String message;
    private LocalDateTime createdAt;

    private String isRead;
    private Integer empId;
    private String roleCode;
    private Integer deptId;
    private String deptCode;
    private String isDelivered;

    private String productName;
    private String lotNo;
}