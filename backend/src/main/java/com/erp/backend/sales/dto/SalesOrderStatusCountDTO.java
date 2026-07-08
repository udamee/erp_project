package com.erp.backend.sales.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SalesOrderStatusCountDTO {
    private String status;
    private Integer count;
}
