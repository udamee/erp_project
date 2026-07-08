package com.erp.backend.shipment.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ShipmentStatusCountDTO {
    private String status;
    private Integer count;
}
