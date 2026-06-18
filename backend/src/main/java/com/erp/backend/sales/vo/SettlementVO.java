package com.erp.backend.sales.vo;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class SettlementVO {

    private Integer settlementId; // 정산 ID (PK)
    private LocalDate startDate; // 정산 시작일
    private LocalDate endDate; // 정산 종료일
    private BigDecimal totalPurchase; // 총 매입액
    private BigDecimal totalSales; // 총 매출액
    private BigDecimal totalReceivable; // 총 매출채권(미수금)
    private BigDecimal totalPayable; // 총 매입채무(미지급금)
    private BigDecimal grossProfit; // 매출총이익
    private BigDecimal profitRate; // 이익률
    private Integer createdBy; // 생성자 ID
    private LocalDate createdAt; // 생성일자

}