package com.erp.backend.customer.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class CustomerCreateRequestDto {

    @NotBlank(message = "거래처명을 입력해주세요.")
    private String customerName;

    @NotBlank(message = "거래처 유형을 선택해주세요.")
    private String customerType;   // PHARMACY(약국) / HOSPITAL(병원)

    private String businessNo;     // 사업자번호 (진위확인 통과한 값)

    private BigDecimal creditLimit; // 여신한도 (null이면 0)

    private String phone;

    private String address;
}