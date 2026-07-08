package com.erp.backend.product.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

// 상품 목록 한 행. 화면 표시에 필요한 PRODUCT 컬럼만 노출한다.
@Getter
@Setter
@NoArgsConstructor
public class ProductSearchResponseDto {

    private Long productId;
    private String productCode;
    private String productName;
    private String makerName;
    private String unit;
    private BigDecimal standardPurchasePrice;
    private BigDecimal standardSalesPrice;
    private String isPrescription;
    private String storageType;
    private String status;
    private LocalDateTime updatedAt;
}
