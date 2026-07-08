package com.erp.backend.sales.vo;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class ItemLotVO {
    private Integer inventoryLotId;
    private Integer productId;
    private String lotNo;
    private LocalDateTime expiryDate;
    private Integer currentQty;
    private LocalDateTime updateAt;
}
