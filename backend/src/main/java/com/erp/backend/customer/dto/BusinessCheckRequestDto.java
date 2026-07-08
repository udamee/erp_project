package com.erp.backend.customer.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BusinessCheckRequestDto {

    @NotBlank(message = "사업자번호를 입력해주세요.")
    private String businessNo;   // 사업자등록번호 (- 있어도 자동 제거)
}