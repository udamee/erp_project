package com.erp.backend.product.api.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class ProductSyncDto {
    /* PRODUCT 테이블 매핑 필드 */

    private String itemSeq;          // PRODUCT.PRODUCT_CODE, API 품목 기준 코드
    private String itemName;         // PRODUCT.PRODUCT_NAME, 상품명
    private String entpName;         // PRODUCT.MAKER_NAME, 제조사명
    private String spcltyPblc;       // PRODUCT.IS_PRESCRIPTION, ProductSyncService에서 Y/N으로 변환
    private String packUnit;         // PRODUCT.UNIT, 포장 단위
    private String storageType;      // PRODUCT.STORAGE_TYPE, ProductSyncService에서 ROOM/COLD/FROZEN으로 변환

    /* PRODUCT_SPEC 테이블 매핑 필드 */

    private String prductType;       // 기본 API 상품 분류
    private String prductPrmisnNo;   // 기본 API 허가 번호
    private String ediCode;          // 기본 API EDI 코드
    private String itemIngrName;     // 성분 API 원료명
    private String itemIngrCnt;      // 성분 API 성분 순번/식별값
    private String mainItemIngr;     // 성분 API 주성분명
    private String totalAmount;      // 성분 API 총량
    private String ingredientUnit;   // 성분 API 단위
    private String storageMethod;    // 상세 API 보관 방법
    private String validTerm;        // 상세 API 유효 기간
}
