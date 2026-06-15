package com.erp.backend.shipment.service;

import com.erp.backend.common.CustomException;
import com.erp.backend.common.ErrorCode;
import com.erp.backend.sales.mapper.SalesOrderMapper;
import com.erp.backend.sales.util.OrderStatus;
import com.erp.backend.sales.vo.ItemLotVO;
import com.erp.backend.sales.vo.SalesOrderDetailVO;
import com.erp.backend.sales.vo.SalesOrderVO;
import com.erp.backend.shipment.Util.MovementType;
import com.erp.backend.shipment.Util.ShipmentStatus;
import com.erp.backend.shipment.Util.SourceType;
import com.erp.backend.shipment.mapper.ShipmentMapper;
import com.erp.backend.shipment.vo.ShipmentDetailVO;
import com.erp.backend.shipment.vo.ShipmentVO;
import com.erp.backend.shipment.vo.StockMovementVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ShipmentService {

    private final ShipmentMapper shipmentMapper;
    private final SalesOrderMapper salesOrderMapper;

    public SalesOrderVO verifySalesOrderStatus(int salesOrderId){
        return shipmentMapper.verifySalesOrderStatus(salesOrderId);
    }

    public ShipmentVO preventDuplicatingShipment(int salesOrderId){
        return shipmentMapper.preventDuplicatingShipment(salesOrderId);
    }

//    public List<ShipmentDetailVO> findShipmentDetail(int shipmentId){
//        return shipmentMapper.findShipmentDetails(shipmentId);
//    }

    public int arrangeShipmentHeader(ShipmentVO shipmentVO){
        return shipmentMapper.arrangeShipmentHeader(shipmentVO);
    }

    public int arrangeShipmentDetail(ShipmentDetailVO shipmentDetailVO){
        return shipmentMapper.arrangeShipmentDetail(shipmentDetailVO);
    }

    public List<ShipmentVO> findShipments(Integer salesOrderId, String status, String employeeName){
        return shipmentMapper.findShipmentList(salesOrderId,status,employeeName);
    }

    public int updateShippingStatus(String status,int shipmentId){
        return shipmentMapper.updateShippingStatus(status,shipmentId);
    }

    @Transactional
    public void processShipment(Integer salesOrderId, Integer employeeId){
        SalesOrderVO order = verifySalesOrderStatus(salesOrderId);
        if(order==null){
            throw new CustomException(ErrorCode.SALES_APPROVE_FAILED);
        }
        ShipmentVO duplicatedShipmentVO = preventDuplicatingShipment(salesOrderId);
        if(duplicatedShipmentVO!=null){
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
        if(headerInserted!=1){
            throw new CustomException(ErrorCode.NOT_FOUND);
        }
        List<SalesOrderDetailVO> salesOrderDetails = shipmentMapper.findApprovedSalesOrderDetails(salesOrderId);
        if(salesOrderDetails==null || salesOrderDetails.isEmpty()){
            throw new CustomException(ErrorCode.NOT_FOUND);
        }
        for(SalesOrderDetailVO detailVO:salesOrderDetails){
           Map<Integer,Integer> allocatableLots = allocateLots(detailVO);
           applyShipmentAllocation(allocatableLots,detailVO,shipmentId,employeeId);
        }
        int orderUpdated = shipmentMapper.updateSaleOrderStatus(OrderStatus.SHIPPED.name(), salesOrderId);
        if(orderUpdated!=1){
            throw new CustomException(ErrorCode.NOT_FOUND);
        }
    }

    private Map<Integer,Integer> allocateLots(SalesOrderDetailVO salesOrderdetailVO) {
        int productId = salesOrderdetailVO.getProductId();
        //현재 배정이 가능한 수량인지 확인
        int orderQty = salesOrderdetailVO.getOrderQty();
        if (orderQty > salesOrderMapper.findAvailableQtyByProductId(productId)) {
            throw new CustomException(ErrorCode.SALES_NOT_AVAILABLE_STOCK);
        }
        //해당하는 로트들을 가져오기
        List<ItemLotVO> itemLotVOS = salesOrderMapper.findAvailableLotByProductId(productId);
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

    private void applyShipmentAllocation(Map<Integer,Integer> allocatableLots,SalesOrderDetailVO salesOrderdetailVO,Integer shipmentId,Integer employeeId){
        int productId = salesOrderdetailVO.getProductId();
        int detailId = salesOrderdetailVO.getSoDetailId();
        for(Map.Entry<Integer,Integer> lot:allocatableLots.entrySet()){
            Integer lotId = lot.getKey();
            Integer assignedQty = lot.getValue();
            int detailInserted = insertShipmentDetail(shipmentId,detailId,lotId,productId,assignedQty);
            if(detailInserted!=1){
                throw new CustomException(ErrorCode.NOT_FOUND);
            }
            int movementInserted = insertStockMovement(shipmentId,employeeId,lotId,assignedQty);
            if(movementInserted!=1){
                throw new CustomException(ErrorCode.NOT_FOUND);
            }
            int decreased = decreaseInventory(lotId,assignedQty);
            if(decreased!=1){
                throw new CustomException(ErrorCode.SALES_NOT_AVAILABLE_STOCK);
            }
        }
    }
    private int insertShipmentDetail(Integer shipmentId,Integer detailId,Integer lotId,Integer productId,Integer assignedQty){
        int shipmentDetailId = shipmentMapper.currentShipmentDetailSeq();
        ShipmentDetailVO shipmentDetailVO = new ShipmentDetailVO();
        shipmentDetailVO.setShipmentDetailId(shipmentDetailId);
        shipmentDetailVO.setShipmentId(shipmentId);
        shipmentDetailVO.setSalesOrderDetailId(detailId);
        shipmentDetailVO.setInventoryLotId(lotId);
        shipmentDetailVO.setProductId(productId);
        shipmentDetailVO.setShippedQty(assignedQty);
        return shipmentMapper.arrangeShipmentDetail(shipmentDetailVO);
    }
    private int insertStockMovement(Integer shipmentId, Integer employeeId, Integer lotId, Integer assignedQty){
        int movementId = shipmentMapper.currentStockMovementSeq();
        StockMovementVO stockMovementVO = new StockMovementVO();
        stockMovementVO.setMovementId(movementId);
        stockMovementVO.setMovementType(MovementType.OUT.name());
        stockMovementVO.setQuantity(assignedQty);
        stockMovementVO.setSourceType(SourceType.SALES_SHIPMENT.name());
        stockMovementVO.setSourceId(shipmentId);
        stockMovementVO.setEmployeeId(employeeId);
        stockMovementVO.setInventoryLotId(lotId);
        //날짜를 DB에서 입력하도록 바꿔야함
        stockMovementVO.setUpdateAt(LocalDateTime.now());
        return shipmentMapper.changeStockMovement(stockMovementVO);
    }
    private int decreaseInventory(Integer lotId,Integer assignedQty){
        StockMovementVO stockMovementVO = new StockMovementVO();
        stockMovementVO.setInventoryLotId(lotId);
        stockMovementVO.setQuantity(assignedQty);
        return shipmentMapper.decreaseInventory(stockMovementVO);
    }

    public List<ShipmentDetailVO> findShipmentDetails(int shipmentId,String status){
        return shipmentMapper.findShipmentDetails(shipmentId,status);
    }
}
