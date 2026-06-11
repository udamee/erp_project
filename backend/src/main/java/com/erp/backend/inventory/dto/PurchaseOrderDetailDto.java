package com.erp.backend.inventory.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
public class PurchaseOrderDetailDto {
    // 발주 품목 요청

    @NotNull(message = "의약품을 선택해주세요.")
    private Long productId;

    @NotNull(message = "수량을 입력해주세요.")
    @Min(value = 1, message = "수량은 1 이상이어야 합니다.")
    private Integer orderQty;

    @NotNull(message = "단가를 입력해주세요.")
    private BigDecimal unitPrice;
}
