package com.erp.backend.settlement.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
public class SalesRequestDto {

    @NotNull(message = "거래처를 선택해주세요.")
    private Integer customerId; // 거래처 ID

    @NotNull(message = "수주번호를 선택해주세요.")
    private Integer soId; // 수주 ID

    @NotNull(message = "청구일자를 선택해주세요.")
    private LocalDate issueDate; // 청구일자

    @NotNull(message = "청구금액을 입력해주세요.")
    private BigDecimal totalAmount; // 총 금액

    @NotNull(message = "상태를 선택해주세요.")
    private String status; // 상태

}