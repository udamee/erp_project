package com.erp.backend.shipment.mapper;
import com.erp.backend.sales.vo.SalesOrderDetailVO;
import com.erp.backend.sales.vo.SalesOrderVO;
import com.erp.backend.shipment.vo.ShipmentDetailVO;
import com.erp.backend.shipment.vo.ShipmentVO;
import com.erp.backend.shipment.vo.StockMovementVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface ShipmentMapper {
    int currentStockMovementSeq();
    int updateInventory(@Param("inventoryId") int inventoryId,@Param("currentQty") int currentQty, @Param("updateAt")LocalDateTime updateDate);
    int changeStockMovement(StockMovementVO stockMovementVO);
    int decreaseInventory(StockMovementVO stockMovementVO);
    int currentShipmentSeq();
    int currentShipmentDetailSeq();
    int arrangeShipmentHeader(ShipmentVO vo);
    int arrangeShipmentDetail(ShipmentDetailVO shipmentDetailVO);
    int updateSaleOrderStatus(@Param("status") String status, @Param("salesOrderId") int salesOrderIt);
    int updateShippingStatus(@Param("status") String status, @Param("shipmentId") int shipmentId);
    StockMovementVO trackProductHistory(int moveId);
    SalesOrderVO verifySalesOrderStatus(int salesOrderId);
    List<SalesOrderDetailVO> findApprovedSalesOrderDetails(int salesOrderId);
    ShipmentVO preventDuplicatingShipment(int salesOrderId);
    List<ShipmentDetailVO> findShipmentDetails(@Param("shipmentId") int shipmentId,@Param("status") String status);
    List<ShipmentVO> findShipmentList(@Param("salesOrderId") Integer salesOrderId,@Param("status") String status,@Param("employeeName") String employeeName);
    ShipmentVO findShipment(int shipmentId,boolean isShipped);
    SalesOrderRequestVO verifyingSalesOrderStatusBySoId(int salesOrderId);
    List<ShipmentHistoryVO> searchShipmentHistory(int salesOrderId);
    List<StockMovementSearchVO> searchStockMovement(StockMovementSearchVO stockMovementSearchVO);
    List<ShipmentResultVO> findShipmentResult(int shipmentId);
}
