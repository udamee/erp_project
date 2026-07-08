package com.erp.backend.shipment.vo;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class ShipmentVO {
    private Integer shipmentId;
    private Integer soId;
    private long shippedEmpId;
    private String employeeName;
    private LocalDateTime shipmentDate;
    private String status;
    private String memo;
    private LocalDateTime createdAt;
}
