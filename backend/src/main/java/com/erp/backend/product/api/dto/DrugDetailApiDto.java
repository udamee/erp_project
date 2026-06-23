package com.erp.backend.product.api.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class DrugDetailApiDto {
    /* ERP 저장 대상 정보 */

    private String itemSeq;          // 품목 기준 코드
    private String storageMethod;    // 보관 방법
    private String validTerm;        // 유효 기간
    private String packUnit;         // 포장 단위

    /* 향후 확장 정보 */

    private String itemEngName;      // 영문 품목명
    private String entpEngName;      // 영문 업체명
    private String rareDrugYn;       // 희귀 의약품 여부
    private String materialName;     // 원료 성분
    private String mainItemIngr;     // 주요 성분
    private String efficacy;         // 효능 효과
    private String usage;            // 용법 용량
    private String precaution;       // 사용상 주의사항
}
