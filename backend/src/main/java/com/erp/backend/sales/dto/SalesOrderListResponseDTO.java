package com.erp.backend.sales.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class SalesOrderListResponseDTO {
    private Integer so_id;
    private String customer_name;
    private String req_employee_name;
    private String app_employee_name;
    private LocalDateTime order_date;
    private String status;
    private LocalDateTime approve_date;
    private BigDecimal total_amount;
    private String memo;
    private LocalDateTime created_at;
    private LocalDateTime updated_at;
}
