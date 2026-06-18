package com.erp.backend.sales.vo;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class SalesOrderVO {
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
