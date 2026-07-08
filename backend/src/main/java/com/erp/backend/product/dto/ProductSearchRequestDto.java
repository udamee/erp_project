package com.erp.backend.product.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// 상품 목록 검색 조건. 모든 항목은 선택값이며 null/빈 값이면 해당 필터를 적용하지 않는다.
@Getter
@Setter
@NoArgsConstructor
public class ProductSearchRequestDto {

    private String keyword;        // 상품명 또는 상품코드 부분검색
    private String status;         // 상품 사용 상태 (ACTIVE/INACTIVE 등)
    private String isPrescription; // 전문 의약품 여부 (Y/N)
    private String storageType;    // 보관 유형 (ROOM/COLD/FROZEN)
}
