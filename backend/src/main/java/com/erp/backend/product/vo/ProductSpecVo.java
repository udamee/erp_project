package com.erp.backend.product.vo;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class ProductSpecVo {
    private Long specId;              // 상품 상세 정보 PK
    private String specName;          // 상세 정보명
    private String description;       // 상세 설명
    private String productCode;       // 상품 코드
    private String useYn;             // 사용 여부, Y/N
    private LocalDateTime createdAt;  // 생성 일시
}
