package com.erp.backend.inventory.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;

import java.util.List;

@Getter
public class PurchaseOrderRequestDto {
    // 발주 등록 요청

    @NotNull(message = "공급처를 선택해주세요.")
    private Long supplierId;

    private String memo;

    @NotNull(message = "발주 품목을 입력해주세요.")
    @Size(min=1, message = "발주 품목은 최소 1개 이상이어야 합니다.")
    private List<PurchaseOrderDetailDto> details;
}
