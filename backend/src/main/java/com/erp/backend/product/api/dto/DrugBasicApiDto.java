package com.erp.backend.product.api.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DrugBasicApiDto {
    // 기본 저장 대상 정보
    private String itemSeq;           // 품목 기준 코드
    private String itemName;          // 품목명
    private String entpName;          // 업체명
    private String spcltyPblc;        // 전문/일반 구분
    private String prductType;        // 제품 분류
    private String prductPrmisnNo;    // 제품 허가 번호
    private String ediCode;           // EDI 코드

    // 확장 정보
    private String itemEngName;       // 영문 품목명
    private String entpEngName;       // 영문 업체명
    private String entpSeq;           // 업체 일련번호
    private String entpNo;            // 업체 허가 번호
    private String itemPermitDate;    // 품목 허가일
    private String induty;            // 업종
    private String permitKindCode;    // 허가 유형 코드
    private String cancelDate;        // 취소일
    private String cancelName;        // 정상/취소 구분명
    private String bizrno;            // 사업자등록번호
    private String bigPrdtImgUrl;     // 제품 이미지 URL
}
