package com.erp.backend.customer.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class CustomerResponseDto {

    private Long customerId;
    private String customerName;
    private String customerType;
    private String businessNo;
    private BigDecimal creditLimit;
    private BigDecimal receivableBalance;
    private String phone;
    private String address;
    private String status;
}