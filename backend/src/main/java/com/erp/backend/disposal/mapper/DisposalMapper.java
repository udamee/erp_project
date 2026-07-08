package com.erp.backend.disposal.mapper;

import com.erp.backend.disposal.vo.DisposalDetailVO;
import com.erp.backend.shipment.vo.StockMovementVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface DisposalMapper {
    Integer getCurrentDisposalSeq();

    Integer getCurrentDisposalDetailSeq();

    Integer insertDisposalRequest(@Param("disposalId") int disposalId, @Param("reason") String reason, @Param("empId") int empId);

    String findDisposalStatus(int disposalId);

    Integer insertDisposalDetail(DisposalDetailVO disposalDetailVO);

    Integer approveDisposalRequest(@Param("approvedBy") int empId, @Param("disposalId") int disposalId);

    Integer rejectDisposalRequest(@Param("rejectReason") String rejectReason, @Param("disposalId") int disposalId);

    Integer completeDisposal(int disposalId);

    Map<String, Object> findInventoryLotForUpdate(int inventoryLotId);

    Integer reduceLotStock(@Param("disposalQty") int disposalQty, @Param("inventoryLotId") int inventoryLotId);

    Integer insertStockMovement(int stmvSeq, int disposalDetailId, StockMovementVO stockMovementVO);

    List<DisposalDetailVO> findDisposalDetails(int disposalId);

    Integer updateInventoryLotStatus(int inventoryLotId);
}
