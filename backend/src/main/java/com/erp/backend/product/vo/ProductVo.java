package com.erp.backend.product.vo;

import lombok.Getter;
import lombok.Setter;
import org.apache.ibatis.type.Alias;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Alias("DrugProductVo")
@Getter
@Setter
public class ProductVo {
    private Long productId;                      // 상품 PK
    private String productCode;                  // 상품 코드, 공공 API ITEM_SEQ 매핑
    private String productName;                  // 상품명
    private String makerName;                    // 제조사명
    private String unit;                         // 포장 단위
    private Long safetyQty;                      // 안전 재고 수량 기준
    private BigDecimal standardPurchasePrice;    // 기준 매입 단가
    private BigDecimal standardSalePrice;        // 기준 판매 단가
    private String isPrescription;               // 전문 의약품 여부, Y/N
    private String storageType;                  // 보관 유형, ROOM/COLD/FROZEN
    private String status;                       // 상품 사용 상태
    private LocalDateTime createdAt;             // 상품 생성 일시
    private LocalDateTime updatedAt;             // 상품 수정 일시
}
