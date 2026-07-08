package com.erp.backend.inventory.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;

import java.util.List;

@Getter
public class ReceivingRequestDto {

    @NotNull(message = "발주 ID를 입력해주세요.")
    private Long poId;

    private String memo;

    @NotNull(message = "입고 품목을 입력해주세요.")
    @Size(min=1, message="입고 품목은 최소 1개 이상이어야 합니다.")
    private List<ReceivingDetailDto> details;
}
