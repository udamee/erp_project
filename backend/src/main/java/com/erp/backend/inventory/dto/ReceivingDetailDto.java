package com.erp.backend.inventory.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import java.math.BigDecimal;
import java.util.Date;

@Getter
public class ReceivingDetailDto {

    @NotNull(message = "의약품을 선택해주세요.")
    private Long productId;

    @NotBlank(message = "로트번호를 입력해주세요.")
    private String lotNo;

    @NotNull(message = "유효기간을 입력해주세요.")
    private Date expiryDate;

    @NotNull(message = "입고 수량을 입력해주세요.")
    @Min(value = 1, message = "입고 수량은 1 이상이어야 합니다.")
    private Integer receivedQty;

    @NotNull(message = "단가를 입력해주세요.")
    private BigDecimal unitPrice;
}