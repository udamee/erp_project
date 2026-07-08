package com.erp.backend.inventory.dto;

import lombok.Builder;
import lombok.Getter;

/*
 * 식약처 의약품 회수·판매중지 1건
 */
@Getter
@Builder
public class RecallDrugDto {

    private String productName;   // 품목명 (PRDUCT)
    private String entrpsName;    // 업체명 (ENTRPS)
    private String recallReason;  // 회수사유 (RTRVL_RESN)
    private String enforceYn;     // 강제여부 (ENFRC_YN) Y/N
    private String commandDate;   // 회수명령일자 (RECALL_COMMAND_DATE)
    private String itemSeq;       // 품목기준코드 (ITEM_SEQ) - 매칭 키
    private String bizrno;        // 사업자등록번호 (BIZRNO)
    private String stdCd;         // 표준코드/바코드 (STD_CD)

    // 우리가 취급하는 품목인지 (PRODUCT 매칭 결과)
    @Builder.Default
    private boolean inStock = false;
    private Long productId;       // 매칭된 우리 PRODUCT ID (있으면)
}