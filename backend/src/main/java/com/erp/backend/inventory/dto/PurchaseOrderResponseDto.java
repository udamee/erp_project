package com.erp.backend.inventory.dto;

import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.util.Date;

@Getter
@Setter
public class PurchaseOrderResponseDto {

    private Long poId;
    private Long supplierId;
    private String supplierName;
    private String supplierPhone;           // 공급처 연락처
    private String requestEmpName;          // 기안자
    private String approveEmpName;          // 승인자
    private Date poDate;                    // 발주일
    private Date approveDate;               // 승인일
    private String status;                  // 상태
    private BigDecimal totalAmount;         // 총 금액
    private String memo;                    // 메모

    // 품목 목록 (상세 조회 시에만 사용)
    private java.util.List<PurchaseOrderDetailResponseDto> details;
}