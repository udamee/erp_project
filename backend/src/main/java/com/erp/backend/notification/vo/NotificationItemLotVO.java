package com.erp.backend.notification.vo;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class NotificationItemLotVO {
    private Integer inventoryLotId;
    private Integer productId;
    private String productName;
    private String lotNo;
    private LocalDateTime expiryDate;
    private Integer currentQty;
    private LocalDateTime updateAt;
}
