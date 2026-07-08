package com.erp.backend.sales.vo;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ProductVO {
    Integer productId;
    String productCode;
    String productName;
    String makerName;
    Boolean isPrescription;
    String storageType;
    String proStatus;
    String lotNo;
    LocalDate expiryDate;
    Integer currentQty;
    String location;
    String lotStatus;
    Integer safetyQty;
    BigDecimal standardSalesPrice;
}
