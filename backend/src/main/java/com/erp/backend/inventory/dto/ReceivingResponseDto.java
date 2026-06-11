package com.erp.backend.inventory.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.Date;
import java.util.List;

@Getter
@Setter
public class ReceivingResponseDto {

    // 입고 헤더 정보
    private Long receivingId;
    private Long poId;
    private String supplierName;
    private String receivedEmpName;
    private Date receivedDate;
    private String status;
    private String memo;

    // 발주 헤더 정보
    private Date poDate;
    private BigDecimal totalAmount;

    // 입고 품목 목록
    private List<ReceivingResponseDto> details;
}
