package com.erp.backend.sales.dto;
import lombok.Data;

import java.util.List;

@Data
public class SalesOrderRequestDTO {
    private int customerId;
    private int employeeId;
    private String memo;
    List<SalesOrderDetailRequestDTO> details;
}
