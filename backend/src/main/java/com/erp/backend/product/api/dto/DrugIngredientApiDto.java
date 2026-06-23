package com.erp.backend.product.api.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class DrugIngredientApiDto {
    /* ERP 저장 대상 정보 */

    private String itemSeq;          // 품목 기준 코드
    private String itemIngrName;     // 주성분명
    private String itemIngrCnt;      // 주성분 순번/개수 식별값

    /* 향후 확장 정보 */

    private String mainItemIngr;     // 대표 주성분
    private String ingrEngName;      // 영문 성분명
    private String totalAmount;      // 총 함량
    private String unit;             // 함량 단위
}
