package com.erp.backend.inventory.service;

import com.erp.backend.common.CustomException;
import com.erp.backend.common.ErrorCode;
import com.erp.backend.inventory.dto.ReceivingDetailDto;
import com.erp.backend.inventory.dto.ReceivingDetailResponseDto;
import com.erp.backend.inventory.dto.ReceivingRequestDto;
import com.erp.backend.inventory.mapper.PurchaseOrderMapper;
import com.erp.backend.inventory.mapper.ReceivingMapper;
import com.erp.backend.settlement.service.SettlementService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReceivingService {

    private final ReceivingMapper receivingMapper;
    private final PurchaseOrderMapper purchaseOrderMapper;
    private final SettlementService settlementService;

    // -------- 입고 가능 목록 조회 ---------
    public List<Map<String, Object>> getReceivableOrders(){
        return receivingMapper.findReceivableOrders();
    }

    // ------- 발주 기준 입고 품목 조회 ----------
    public List<ReceivingDetailResponseDto> getReceivingDetailsByPoId(Long poId){
        // 발주 존재 여부 확인
        Map<String,Object> po = purchaseOrderMapper.findPoStatusById(poId);
        if(po==null){
            throw new CustomException(ErrorCode.PURCHASE_ORDER_NOT_FOUND);
        }
        // 발주 상태 확인
        if(!"APPROVED".equals(po.get("STATUS"))){
            throw new CustomException(ErrorCode.INVALID_ORDER_STATUS);
        }
        return receivingMapper.findReceivingDetailsByPoId(poId);
    }

    // ---------   입고 처리  -------------
    @Transactional
    public void processReceiving(ReceivingRequestDto requestDto, Long receivedEmpId){
        // 발주 존재 여부 확인
        Map<String, Object> po = purchaseOrderMapper.findPoStatusById(requestDto.getPoId());
        if(po==null){
            throw new CustomException(ErrorCode.PURCHASE_ORDER_NOT_FOUND);
        }

        // 발주 상태 확인 (APPROVED일 때만 입고 가능)
        if(!"APPROVED".equals(po.get("STATUS"))){
            throw new CustomException(ErrorCode.INVALID_ORDER_STATUS);
        }

        // 중복 입고 방지
        int count = receivingMapper.countReceivingByPoId(requestDto.getPoId());
        if (count > 0){
            throw new CustomException(ErrorCode.ALREADY_RECEIVED);
        }

        // 품목별 유효성 검사 (의약품 존재 여부 + 유효기간)
        for (ReceivingDetailDto detail : requestDto.getDetails()) {
            // 의약품 존재 여부
            Map<String, Object> product =
                    purchaseOrderMapper.findProductById(detail.getProductId());
            if (product == null) {
                throw new CustomException(ErrorCode.PRODUCT_NOT_FOUND);
            }

            // 유효기간 검사 (현재 날짜보다 이전이면 예외)
            if (detail.getExpiryDate().before(new Date())) {
                throw new CustomException(ErrorCode.INVALID_EXPIRY_DATE);
            }
        }

        // 입고 헤더 INSERT
        Map<String, Object> receivingParams = new HashMap<>();
        receivingParams.put("poId", requestDto.getPoId());
        receivingParams.put("receivedEmpId", receivedEmpId);
        receivingParams.put("memo", requestDto.getMemo());
        receivingMapper.insertReceiving(receivingParams);

        // 방금 생성된 RECEIVING_ID 조회
        Long receivingId = receivingMapper.getCurrentReceivingId();

        // 품목별 입고 상세 INSERT + 재고 생성 + 이력 저장
        for (ReceivingDetailDto detail : requestDto.getDetails()) {

            // 입고 상세 INSERT
            Map<String, Object> detailParams = new HashMap<>();
            detailParams.put("receivingId", receivingId);
            detailParams.put("productId", detail.getProductId());
            detailParams.put("lotNo", detail.getLotNo());
            detailParams.put("expiryDate", detail.getExpiryDate());
            detailParams.put("receivedQty", detail.getReceivedQty());
            detailParams.put("unitPrice", detail.getUnitPrice());
            receivingMapper.insertReceivingDetail(detailParams);

            // 재고 생성 (INVENTORY_LOT INSERT)
            Map<String, Object> lotParams = new HashMap<>();
            lotParams.put("productId", detail.getProductId());
            lotParams.put("lotNo", detail.getLotNo());
            lotParams.put("expiryDate", detail.getExpiryDate());
            lotParams.put("receivedQty", detail.getReceivedQty());
            receivingMapper.upsertInventoryLot(lotParams);

            // 방금 생성된 INVENTORY_LOT_ID 조회
            Long inventoryLotId = receivingMapper.findInventoryLotId(lotParams);

            // 입출고 이력 INSERT (STOCK_MOVEMENT)
            Map<String, Object> movementParams = new HashMap<>();
            movementParams.put("inventoryLotId", inventoryLotId);
            movementParams.put("qty", detail.getReceivedQty());
            movementParams.put("receivingId", receivingId);
            movementParams.put("createdBy", receivedEmpId);
            receivingMapper.insertStockMovement(movementParams);
        }

        // 발주 상태 COMPLETED 변경
        receivingMapper.completePurchaseOrder(requestDto.getPoId());

        // 입고가 완료된 발주를 매입전표와 매입채무로 연계
        settlementService.createPurchaseInvoiceForCompletedOrder(requestDto.getPoId());
    }
}

