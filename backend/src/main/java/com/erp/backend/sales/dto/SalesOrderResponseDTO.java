package com.erp.backend.sales.dto;

import lombok.Getter;
import lombok.Setter;

import com.erp.backend.sales.vo.SalesOrderDetailVO;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class SalesOrderResponseDTO {
    Integer soId;
    Integer customerId;
    String customerName;
    Integer reqEmployeeId;
    String reqEmployeeName;
    Integer appEmployeeId;
    String appEmployeeName;
    LocalDateTime orderDate;
    LocalDateTime approveDate;
    String status;
    BigDecimal totalAmount;
    String memo;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
    List<SalesOrderDetailVO> detailList;
}
