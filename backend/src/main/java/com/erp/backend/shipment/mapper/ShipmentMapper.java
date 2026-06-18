package com.erp.backend.shipment.mapper;
import com.erp.backend.sales.vo.ProductStockCheckVO;
import com.erp.backend.sales.vo.SalesOrderDetailVO;
import com.erp.backend.sales.vo.SalesOrderVO;
import com.erp.backend.shipment.vo.*;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface ShipmentMapper {
    //재고 변동이력 시퀀스
    int currentStockMovementSeq();
    //로트의 현재고 수정일시 갱신
    int updateInventory(@Param("inventoryId") int inventoryId,@Param("currentQty") int currentQty, @Param("updateAt")LocalDateTime updateDate);
    //재고 변동 이력 생성
    int changeStockMovement(StockMovementVO stockMovementVO);
    //출고 수량 반영 로트 차감
    int decreaseInventory(StockMovementVO stockMovementVO);
    //출고 시퀸스
    int currentShipmentSeq();
    //출고 디테일 시퀸스
    int currentShipmentDetailSeq();
    //출고 정보 셍성
    int arrangeShipmentHeader(ShipmentVO vo);
    //출고 디테일 정보 생성
    int arrangeShipmentDetail(ShipmentDetailVO shipmentDetailVO);
    //주문 상태 갱신
    int updateSaleOrderStatus(@Param("status") String status, @Param("salesOrderId") int salesOrderIt);
    //출고 상태 갱신
    int updateShippingStatus(@Param("status") String status, @Param("shipmentId") int shipmentId);
    //특정 재고 변동 이력 조회
    StockMovementVO trackProductHistory(int moveId);
    //주문 출고 승인 여부 검사
    SalesOrderVO verifySalesOrderStatus(int salesOrderId);
    //출고처리가 필요한 상세목록 조회
    List<SalesOrderDetailVO> findApprovedSalesOrderDetails(int salesOrderId);
    //중복 출고 방지
    ShipmentVO preventDuplicatingShipment(int salesOrderId);
    //조건에 따른 출고 상세 목록 조회
    List<ShipmentDetailVO> findShipmentDetails(@Param("shipmentId") int shipmentId,@Param("status") String status);
    //조건에 따른 출고 목록 조회
    List<ShipmentVO> findShipmentList(@Param("salesOrderId") Integer salesOrderId,@Param("status") String status,@Param("employeeName") String employeeName);
    //출고 정보 조회
    ShipmentVO findShipment(int shipmentId,boolean isShipped);
    //출고 가능 상태 정보 조회
    SalesOrderRequestVO verifyingSalesOrderStatusBySoId(int salesOrderId);
    //출고 이력 조회
    List<ShipmentHistoryVO> searchShipmentHistory(int salesOrderId);
    //재고 변동 이력 조회
    List<StockMovementSearchVO> searchStockMovement(StockMovementSearchVO stockMovementSearchVO);
    //출고 처리 결과 조회
    List<ShipmentResultVO> findShipmentResult(int shipmentId);
}
