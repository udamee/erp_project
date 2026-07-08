package com.erp.backend.inventory.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.Date;

@Getter
@Setter
public class ReceivingDetailResponseDto {

    private Long receivingDetailId;
    private Long productId;
    private String productCode;
    private String productName;
    private String unit;
    private String lotNo;
    private Date expityDate;
    private Integer receivedQty;
    private BigDecimal unitPrice;
}
