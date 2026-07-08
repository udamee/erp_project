package com.erp.backend.sales.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class SalesOrderListResponseDTO {
    private Integer soId;
    private String customerName;
    private String reqEmployeeName;
    private String appEmployeeName;
    private LocalDateTime orderDate;
    private String status;
    private LocalDateTime approveDate;
    private BigDecimal totalAmount;
    private String memo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
