package com.erp.backend.inventory.mapper;

import com.erp.backend.inventory.dto.ReceivingDetailResponseDto;
import com.erp.backend.inventory.dto.ReceivingResponseDto;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;
import java.util.Map;

@Mapper
public interface ReceivingMapper {

    // 입고 가능 목록 조회 (APPROVED 상태 발주)
    List<Map<String, Object>> findReceivableOrders();

    // 입고 상세 조회
    ReceivingResponseDto findReceivingById(Long receivingId);

    // 발주 기준 입고 상세 조회
    List<ReceivingDetailResponseDto> findReceivingDetailsByPoId(Long poId);

    // 입고 헤더 INSERT
    int insertReceiving(Map<String, Object> params);

    // 입고 상세 INSERT
    int insertReceivingDetail(Map<String, Object> params);

    // 재고 INSERT
    int upsertInventoryLot(Map<String, Object> params);

    // LOT 상세조회
    Long findInventoryLotId(Map<String, Object> params);

    // 입출고 이력 INSERT
    int insertStockMovement(Map<String, Object> params);

    // 발주 상태 COMPLETED 변경
    int completePurchaseOrder(Long poId);

    // 현재 RECEIVING 시퀀스 값 조회
    Long getCurrentReceivingId();

    // 현재 INVENTORY_LOT 시퀀스 값 조회
    Long getCurrentInventoryLotId();

    // 중복 입고 확인
    int countReceivingByPoId(Long poId);
}
