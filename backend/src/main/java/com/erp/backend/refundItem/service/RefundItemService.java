package com.erp.backend.refundItem.service;

import com.erp.backend.common.CustomException;
import com.erp.backend.common.ErrorCode;
import com.erp.backend.refundItem.mapper.RefundItemMapper;
import com.erp.backend.refundItem.vo.ReturnedItemRequestVO;
import com.erp.backend.refundItem.vo.ReturnedItemVO;
import com.erp.backend.refundItem.vo.SalesOrderRefundVO;
import com.erp.backend.shipment.mapper.ShipmentMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RefundItemService {

    private final RefundItemMapper refundItemMapper;
    private final ShipmentMapper shipmentMapper;

    private Integer getCurrentSeqForReturnRequestId() {
        return refundItemMapper.getCurrentSeqReturnRequestId();
    }

    private Integer getCurrentSeqReturnRequestGroupId() {
        return refundItemMapper.getCurrentSeqForReturnRequestGroupId();
    }

    public Integer checkReturnableItemAmount(int shipmentDetailId) {
        return refundItemMapper.findRefundableItemStatus(shipmentDetailId);
    }

    private List<SalesOrderRefundVO> existSalesOrder(int salesOrderId) {
        return refundItemMapper.existSalesOrder(salesOrderId);
    }

    public List<ReturnedItemRequestVO> findReturnRequestTarget(int salesOrderId) {
        return refundItemMapper.findReturnRequestTarget(salesOrderId);
    }

    public List<ReturnedItemRequestVO> findReturnRequestsByGroupId(int returnGroupId) {
        return refundItemMapper.findReturnRequestsByGroupId(returnGroupId);
    }

    @Transactional
    public int requestReturn(List<ReturnedItemRequestVO> returnRequests, int empId) {
        if (returnRequests == null || returnRequests.isEmpty()) {
            throw new CustomException(ErrorCode.RETURN_REQUEST_FAILED);
        }
        Integer soId = returnRequests.get(0).getSalesOrderId();
        if (soId == null || soId <= 0) {
            throw new CustomException(ErrorCode.RETURN_SALES_ORDER_NOT_FOUND);
        }
        if (existSalesOrder(soId).isEmpty()) {
            throw new CustomException(ErrorCode.RETURN_SALES_ORDER_NOT_FOUND);
        }
        boolean differentOrder = returnRequests.stream().anyMatch(item -> !soId.equals(item.getSalesOrderId()));
        if (differentOrder) {
            throw new CustomException(ErrorCode.RETURN_DIFFERENT_SALES_ORDER_INCLUDED);
        }
        List<ReturnedItemRequestVO> targets = findReturnRequestTarget(soId);
        if (targets.isEmpty()) {
            throw new CustomException(ErrorCode.RETURN_TARGET_NOT_FOUND);
        }
        int returnedGroupId = getCurrentSeqReturnRequestGroupId();
        for (ReturnedItemRequestVO item : returnRequests) {
            ReturnedItemRequestVO target = targets.stream().filter(returnedItem -> returnedItem.getShipmentDetailId()
                            .equals(item.getShipmentDetailId()))
                    .findFirst()
                    .orElseThrow(() -> new CustomException(ErrorCode.RETURN_TARGET_NOT_FOUND));
            Integer returnQty = item.getReturnQty();
            if (returnQty == null || returnQty <= 0) {
                throw new CustomException(ErrorCode.RETURN_QTY_ERROR);
            }
            Integer returnableQty = checkReturnableItemAmount(target.getShipmentDetailId());
            if (returnableQty == null || returnableQty <= 0) {
                throw new CustomException(ErrorCode.RETURN_TARGET_NOT_FOUND);
            }
            if (returnQty > returnableQty) {
                throw new CustomException(ErrorCode.RETURN_QTY_ERROR);
            }
            item.setReturnId(getCurrentSeqForReturnRequestId());
            item.setReturnGroupId(returnedGroupId);
            item.setSalesOrderId(soId);
            item.setSoDetailId(target.getSoDetailId());
            item.setShipmentDetailId(target.getShipmentDetailId());
            item.setInventoryLotId(target.getInventoryLotId());
            item.setProductId(target.getProductId());
            item.setCreatedBy(empId);
            int inserted = refundItemMapper.insertReturnRequest(item);
            if (inserted != 1) {
                throw new CustomException(ErrorCode.RETURN_PROCESS_FAILED);
            }
        }
        return returnedGroupId;
    }

    @Transactional
    public boolean rejectReturn(int returnGroupId, String rejectReason) {
        if (rejectReason == null || rejectReason.isBlank()) {
            throw new CustomException(ErrorCode.REJECT_REASON_REQUIRED);
        }
        List<ReturnedItemRequestVO> requests = getRequestedReturnGroup(returnGroupId);
        int updated = refundItemMapper.rejectReturnRequest(returnGroupId, rejectReason);
        if (updated != requests.size()) {
            throw new CustomException(ErrorCode.RETURN_REJECTION_FAILED);
        }
        return true;
    }

    private List<ReturnedItemRequestVO> getRequestedReturnGroup(int returnGroupId) {
        List<ReturnedItemRequestVO> requests =
                findReturnRequestsByGroupId(returnGroupId);
        if (requests == null || requests.isEmpty()) {
            throw new CustomException(ErrorCode.RETURN_REQUEST_NOT_FOUND);
        }
        boolean notRequested = requests.stream()
                .anyMatch(item ->
                        !"REQUESTED".equals(item.getStatus()));
        if (notRequested) {
            throw new CustomException(ErrorCode.RETURN_REQUEST_NOT_REQUESTED);
        }
        return requests;
    }

    @Transactional
    public boolean approveReturn(int returnGroupId, int approvedBy) {
        getRequestedReturnGroup(returnGroupId);
        List<ReturnedItemRequestVO> requests = findReturnRequestsByGroupId(returnGroupId);
        int updated = refundItemMapper.approveReturnRequest(returnGroupId, approvedBy);
        if (updated != requests.size()) {
            throw new CustomException(ErrorCode.RETURN_APPROVAL_FAILED);
        }
        return true;
    }

    private boolean verifyReturnedItemRequest(int returnId) {
        ReturnedItemVO returnedItem = refundItemMapper.verifyShippedQtyAndReturnedQty(returnId);
        if (returnedItem == null || returnedItem.getOutQty() == null || returnedItem.getReturnedQty() == null) {
            throw new CustomException(ErrorCode.RETURN_QUANTITY_MISMATCH);
        }
        return returnedItem.getReturnedQty() <= returnedItem.getOutQty();
    }

    private void insertStockMovement(int empId, int returnId) {
        int smvSeq = shipmentMapper.currentStockMovementSeq();
        int result = refundItemMapper.insertStockMovement(smvSeq,empId,returnId);
        if (result != 1) {
            throw new CustomException(ErrorCode.RETURN_PROCESS_FAILED);
        }
    }

    private BigDecimal processRefund(int soId, int returnGroupId) {
        BigDecimal refundTotal = refundItemMapper.calculateReturnedRequestAmount(returnGroupId);
        if (refundTotal == null || refundTotal.compareTo(BigDecimal.ZERO) <= 0) {
            throw new CustomException(ErrorCode.RETURN_INVALID_REFUND_AMOUNT);
        }
        int updated = refundItemMapper.modifyBalance(soId, returnGroupId);
        if (updated != 1) {
            throw new CustomException(ErrorCode.RETURN_SALES_ORDER_BALANCE_UPDATE_FAILED);
        }
        return refundTotal;
    }

    @Transactional
    public BigDecimal completeReturn(int returnGroupId, int empId) {
        List<ReturnedItemRequestVO> requestItems =
                findReturnRequestsByGroupId(returnGroupId);
        if (requestItems == null || requestItems.isEmpty()) {
            throw new CustomException(ErrorCode.RETURN_REQUEST_NOT_FOUND);
        }
        boolean notApproved = requestItems.stream()
                .anyMatch(item -> !"APPROVED".equals(item.getStatus()));
        if (notApproved) {
            throw new CustomException(ErrorCode.RETURN_REQUEST_NOT_APPROVED);
        }
        Integer soId = requestItems.get(0).getSalesOrderId();
        for (ReturnedItemRequestVO requestItem : requestItems) {
            int restored = refundItemMapper.restoreLotStock(requestItem.getInventoryLotId(), requestItem.getReturnQty());
            if (restored != 1) {
                throw new CustomException(ErrorCode.RETURN_PROCESS_FAILED);
            }
            insertStockMovement(empId, requestItem.getReturnId());
            if (!verifyReturnedItemRequest(requestItem.getReturnId())) {
                throw new CustomException(ErrorCode.RETURN_QUANTITY_MISMATCH);
            }
        }
        BigDecimal refundTotal = processRefund(soId, returnGroupId);
        int updated = refundItemMapper.updateReturnRequestStatus(returnGroupId);
        if (updated != requestItems.size()) {
            throw new CustomException(ErrorCode.RETURN_PROCESS_FAILED);
        }
        return refundTotal;
    }
}
