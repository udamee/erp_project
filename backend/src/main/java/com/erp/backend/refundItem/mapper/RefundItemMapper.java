package com.erp.backend.refundItem.mapper;

import com.erp.backend.refundItem.vo.ReturnedItemRequestVO;
import com.erp.backend.refundItem.vo.ReturnedItemVO;
import com.erp.backend.refundItem.vo.SalesOrderRefundVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.math.BigDecimal;
import java.util.List;

@Mapper
public interface RefundItemMapper {

    Integer getCurrentSeqReturnRequestId();
    Integer getCurrentSeqForReturnRequestGroupId();
    Integer findRefundableItemStatus(int shipmentDetailId);
    List<SalesOrderRefundVO> existSalesOrder(int salesOrderId);
    List<ReturnedItemRequestVO> findReturnRequestTarget (int itemId);
    Integer insertReturnRequest(ReturnedItemRequestVO returnedItemRequestVO);
    List<ReturnedItemRequestVO> findReturnRequestsByGroupId(int returnGroupId);
    Integer approveReturnRequest(@Param("returnGroupId")int retundGroupId,@Param("approvedBy")int approvedBy);
    Integer rejectReturnRequest(@Param("returnGroupId")int retundGroupId,@Param("reason")String rejectReason);
    Integer restoreLotStock(@Param("returnQty") int returnQty, @Param("inventoryLotId") int  inventoryLotId);
    Integer insertStockMovement(@Param("stmvSeq")int stmvSeq,@Param("empId")int empId,@Param("returnId")int returnId);
    ReturnedItemVO verifyShippedQtyAndReturnedQty(@Param("returnId") int returnId);
    BigDecimal calculateReturnedRequestAmount(int returnGroupId);
    Integer modifyBalance(@Param("salesOrderId")int salesOrderId,@Param("returnGroupId")int returnGroupId);
    Integer updateReturnRequestStatus(int returnGroupId);
}
