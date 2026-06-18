package com.erp.backend.sales.dto;

import lombok.Getter;

import java.time.LocalDate;

@Getter
public class SettlementRequestDto {
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer createdBy;
}
