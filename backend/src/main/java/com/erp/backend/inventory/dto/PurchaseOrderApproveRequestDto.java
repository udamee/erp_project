package com.erp.backend.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class PurchaseOrderApproveRequestDto {

    @NotBlank(message = "반려 사유를 입력해주세요.")
    private String rejectReason;

}
