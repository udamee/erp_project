package com.erp.backend.sales.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SalesOrderDetailRequestDTO {
    private Integer productId;
    private Integer orderQty;
}
