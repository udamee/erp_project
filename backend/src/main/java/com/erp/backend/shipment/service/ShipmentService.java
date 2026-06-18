package com.erp.backend.shipment.service;

import com.erp.backend.common.CustomException;
import com.erp.backend.common.ErrorCode;
import com.erp.backend.notification.mapper.AlertMapper;
import com.erp.backend.notification.service.AlertService;
import com.erp.backend.sales.mapper.SalesOrderMapper;
import com.erp.backend.sales.util.OrderStatus;
import com.erp.backend.sales.vo.*;
import com.erp.backend.shipment.util.MovementType;
import com.erp.backend.shipment.util.ShipmentStatus;
import com.erp.backend.shipment.util.SourceType;
import com.erp.backend.shipment.mapper.ShipmentMapper;
import com.erp.backend.shipment.vo.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ShipmentService {

    private final ShipmentMapper shipmentMapper;
    private final SalesOrderMapper salesOrderMapper;
    private final AlertService alertService;

    //주문 출고 승인여부 확인
    private SalesOrderVO verifySalesOrderStatus(int salesOrderId) {
        return shipmentMapper.verifySalesOrderStatus(salesOrderId);
    }

    //중복 출고 확인 및 금지
    private ShipmentVO preventDuplicatingShipment(int salesOrderId) {
        return shipmentMapper.preventDuplicatingShipment(salesOrderId);
    }

//    public List<ShipmentDetailVO> findShipmentDetail(int shipmentId){
//        return shipmentMapper.findShipmentDetails(shipmentId);
//    }

    //출고 정보 생성
    private int arrangeShipmentHeader(ShipmentVO shipmentVO) {
        return shipmentMapper.arrangeShipmentHeader(shipmentVO);
    }

    //출고 상세정보 생성
    private int arrangeShipmentDetail(ShipmentDetailVO shipmentDetailVO) {
        return shipmentMapper.arrangeShipmentDetail(shipmentDetailVO);
    }

    //출고 목록조회(주문번호,상태,담장자명)
    public List<ShipmentVO> findShipments(Integer salesOrderId, String status, String employeeName) {
        return shipmentMapper.findShipmentList(salesOrderId, status, employeeName);
    }

    //출고 상태 변경
    public int updateShippingStatus(String status, int shipmentId) {
        return shipmentMapper.updateShippingStatus(status, shipmentId);
    }

    private void validateAvailableQtyFromTotalQty(int productId, int orderQty) {
        ProductStockCheckVO productStockChecked = shipmentMapper.findShippableProductForShipment(productId);
        if (productStockChecked == null) {
            throw new CustomException(ErrorCode.NOT_FOUND);
        }
        if (productStockChecked.getShippableQty() == null || productStockChecked.getShippableQty() < orderQty) {
            throw new CustomException(ErrorCode.NOT_FOUND);
        }
    }

    private int calculateShippableQty(List<ItemLotVO> itemLotVOList) {
        int availableQty = 0;
        int safetyQty = 0;
        for (ItemLotVO itemLotVO : itemLotVOList) {
            if (itemLotVO.getCurrentQty() != null) {
                availableQty += itemLotVO.getCurrentQty();
            }
        }
        return availableQty - safetyQty;
    }

    /*승인돈 주문 FEFO에 따른 재고 차감
     *
     *승인된 주문 기준 출고를 생성하고
     *주문 상태를 확인 FEFO를 배정 뒤 출고상세,재고이력,재고차감 처리
     *
     * 출고 처리 흐름
     * 1. verifySalesOrderStatus: 주문 승인 상태 확인
     * 2. preventDuplicatingShipment: 중복 출고 여부 확인
     * 3. allocateLots: FEFO 기준 로트 배정
     * 4. applyShipmentAllocation: 출고 상세 생성, 재고 이력 생성, 재고 차감 처리
     */

    @Transactional
    public void processShipment(Integer salesOrderId, Integer employeeId) {
        SalesOrderVO order = verifySalesOrderStatus(salesOrderId);
        if (order == null) {
            throw new CustomException(ErrorCode.SALES_APPROVE_FAILED);
        }
        ShipmentVO duplicatedShipmentVO = preventDuplicatingShipment(salesOrderId);
        if (duplicatedShipmentVO != null) {
            throw new CustomException(ErrorCode.SHIPMENT_ALREADY_EXISTS);
        }
        int shipmentId = shipmentMapper.currentShipmentSeq();
        ShipmentVO shipmentVO = new ShipmentVO();
        shipmentVO.setSoId(salesOrderId);
        shipmentVO.setShipmentId(shipmentId);
        shipmentVO.setShippedEmpId(employeeId);
        shipmentVO.setStatus(ShipmentStatus.SHIPPED.name());
        shipmentVO.setShipmentDate(LocalDateTime.now());
        shipmentVO.setCreatedAt(LocalDateTime.now());
        int headerInserted = arrangeShipmentHeader(shipmentVO);
        if (headerInserted != 1) {
            throw new CustomException(ErrorCode.NOT_FOUND);
        }
        List<SalesOrderDetailVO> salesOrderDetails = shipmentMapper.findApprovedSalesOrderDetails(salesOrderId);
        if (salesOrderDetails == null || salesOrderDetails.isEmpty()) {
            throw new CustomException(ErrorCode.NOT_FOUND);
        }
        Set<Integer> shippedProductIds = new HashSet<>();
        for (SalesOrderDetailVO detailVO : salesOrderDetails) {
            validateAvailableQtyFromTotalQty(detailVO.getProductId(), detailVO.getOrderQty());
            Map<Integer, Integer> allocatableLots = allocateLots(detailVO);
            applyShipmentAllocation(allocatableLots, detailVO, shipmentId, employeeId);
            shippedProductIds.add(detailVO.getProductId());
        }
        int orderUpdated = shipmentMapper.updateSaleOrderStatus(OrderStatus.SHIPPED.name(), salesOrderId);
        if (orderUpdated != 1) {
            throw new CustomException(ErrorCode.NOT_FOUND);
        }
        for (Integer productId : shippedProductIds) {
            alertService.checkAfterShipment(productId);
        }
    }

    //주문 상세 수량을 FEFO기준으로 로트에 배정
    //
    //가용 재고를 확인한 뒤 유통기한이 빠른 순서로 출고수량을 배정
    private Map<Integer, Integer> allocateLots(SalesOrderDetailVO salesOrderdetailVO) {
        int productId = salesOrderdetailVO.getProductId();
        int orderQty = salesOrderdetailVO.getOrderQty();

        //해당하는 로트들을 가져오기
        List<ItemLotVO> itemLotVOS = salesOrderMapper.findAvailableLotByProductId(productId);
        if (itemLotVOS == null || itemLotVOS.isEmpty()) {
            throw new CustomException(ErrorCode.SALES_LOT_ALLOCATE_FAILED);
        }

        //안전재고 반영 수량 계산
        int availableQty = salesOrderMapper.findAvailableQtyByProductId(productId);
        int safetyQty = salesOrderMapper.findSafetyQtyByProductId(productId);
        if (orderQty > availableQty) {
            throw new CustomException(ErrorCode.SALES_NOT_AVAILABLE_STOCK);
        }

//        int afterAvailableQty = availableQty - orderQty;
//        if (afterAvailableQty <= safetyQty) {
//            createSafetyStockAlert(productId, afterAvailableQty, safetyQty);
//        }

        Map<Integer, Integer> allocatableLots = new LinkedHashMap<>();
        int remains = orderQty;
        for (ItemLotVO itemLotVO : itemLotVOS) {
            int assignedQty = Math.min(remains, itemLotVO.getCurrentQty());
            if (assignedQty > 0) {
                remains = remains - assignedQty;
                allocatableLots.put(itemLotVO.getInventoryLotId(), assignedQty);
            }
            if (remains == 0) {
                break;
            }
        }
        if (remains > 0) {
            throw new CustomException(ErrorCode.SALES_LOT_ALLOCATE_FAILED);
        }
        return allocatableLots;
    }

    //배정된 로트 기준으로 출고 상세,재고 이력생성, 재고 차감 처리
    private void applyShipmentAllocation(Map<Integer, Integer> allocatableLots, SalesOrderDetailVO salesOrderdetailVO, Integer shipmentId, Integer employeeId) {
        int productId = salesOrderdetailVO.getProductId();
        int detailId = salesOrderdetailVO.getSoDetailId();
        for (Map.Entry<Integer, Integer> lot : allocatableLots.entrySet()) {
            Integer lotId = lot.getKey();
            Integer assignedQty = lot.getValue();
            int shipmentDetailId = insertShipmentDetail(shipmentId, detailId, lotId, productId, assignedQty);
            insertStockMovement(shipmentDetailId, employeeId, lotId, assignedQty);
            decreaseInventory(lotId, assignedQty);
        }
    }

    //출고 상세 데이터 생성
    private int insertShipmentDetail(Integer shipmentId, Integer detailId, Integer lotId, Integer productId, Integer assignedQty) {
        int shipmentDetailId = shipmentMapper.currentShipmentDetailSeq();
        ShipmentDetailVO shipmentDetailVO = new ShipmentDetailVO();
        shipmentDetailVO.setShipmentDetailId(shipmentDetailId);
        shipmentDetailVO.setShipmentId(shipmentId);
        shipmentDetailVO.setSalesOrderDetailId(detailId);
        shipmentDetailVO.setInventoryLotId(lotId);
        shipmentDetailVO.setProductId(productId);
        shipmentDetailVO.setShippedQty(assignedQty);
        int inserted = shipmentMapper.arrangeShipmentDetail(shipmentDetailVO);
        if (inserted != 1) {
            throw new CustomException(ErrorCode.SHIPMENT_DETAIL_FAILED);
        }
        return shipmentDetailId;
    }

    //재고 변동 이력 기록
    private void insertStockMovement(Integer shipmentDetailId, Integer employeeId, Integer lotId, Integer assignedQty) {
        int movementId = shipmentMapper.currentStockMovementSeq();
        StockMovementVO stockMovementVO = new StockMovementVO();
        stockMovementVO.setMovementId(movementId);
        stockMovementVO.setMovementType(MovementType.OUT.name());
        stockMovementVO.setQuantity(assignedQty);
        stockMovementVO.setSourceType(SourceType.SHIPMENT_DETAIL.name());
        stockMovementVO.setSourceId(shipmentDetailId);
        stockMovementVO.setEmployeeId(employeeId);
        stockMovementVO.setInventoryLotId(lotId);
        int result = shipmentMapper.changeStockMovement(stockMovementVO);
        if (result != 1) {
            throw new CustomException(ErrorCode.STCOKMOVEMENT_FAILED);
        }
    }

    //출고수량 반영 로트재고 차감
    private void decreaseInventory(Integer lotId, Integer assignedQty) {
        StockMovementVO stockMovementVO = new StockMovementVO();
        stockMovementVO.setInventoryLotId(lotId);
        stockMovementVO.setQuantity(assignedQty);
        int result = shipmentMapper.decreaseInventory(stockMovementVO);
        if (result != 1) {
            throw new CustomException(ErrorCode.SALES_NOT_AVAILABLE_STOCK);
        }
    }

    //주문의 출고 가능 상태 조회
    public SalesOrderRequestVO verifyingSalesOrderStatusBySoId(int salesOrderId) {
        return shipmentMapper.verifyingSalesOrderStatusBySoId(salesOrderId);
    }

    //출고의 상세 목록 상태에따라 조회
    public List<ShipmentDetailVO> findShipmentDetails(int shipmentId, String status) {
        return shipmentMapper.findShipmentDetails(shipmentId, status);
    }

    //출고의 처리 결과를 조회
    public List<ShipmentResultVO> findShipmentResult(int shipmentId) {
        return shipmentMapper.findShipmentResult(shipmentId);
    }

    //재고 변동 이력을 조회
    public List<StockMovementSearchVO> searchStockMovementHistory(StockMovementSearchVO stockMovementSearchVO) {
        return shipmentMapper.searchStockMovement(stockMovementSearchVO);
    }

    //출고 이력 조회
    public List<ShipmentHistoryVO> searchShipmentHistory(int salesOrderId) {
        return shipmentMapper.searchShipmentHistory(salesOrderId);
    }

}