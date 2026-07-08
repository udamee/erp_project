package com.erp.backend.disposal.vo;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DisposalDetailVO {
    private Integer disposalDetailId;
    private Integer disposalId;
    private Integer inventoryLotId;
    private Integer productId;
    private Integer disposalQty;
    private String reason;
}
