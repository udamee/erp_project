package com.erp.backend.inventory.mapper;

import com.erp.backend.inventory.dto.PurchaseOrderDetailResponseDto;
import com.erp.backend.inventory.dto.PurchaseOrderResponseDto;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;
import java.util.Map;

@Mapper
public interface PurchaseOrderMapper {

    // 공급처 목록 조회
    List<Map<String, Object>> findAllSuppliers();
    // 의약품 목록 조회
    List<Map<String, Object>> findAllProducts();
    // 발주 목록 조회
    List<Map<String, Object>> findAllPurchaseOrders(Map<String, Object> params);

    // 발주 목록 페이징 처리
    List<Map<String, Object>> findPurchaseOrdersPaging(Map<String, Object> params);
    int countPurchaseOrders(Map<String, Object> params);
    List<Map<String, Object>> countByStatus();

    // 발주 상세조회
    PurchaseOrderResponseDto findPurchaseOrderById(Long id);
    List<PurchaseOrderDetailResponseDto> findPurchaseOrderDetails(Long poId);

    // 발주 등록
    int insertPurchaseOrder(Map<String, Object> params);
    int insertPurchaseOrderDetail(Map<String, Object> params);
    Long getCurrentPoId();

    // 발주등록 유효성검사 위한 메서드
    Map<String, Object> findSupplierById(Long supplierId); // 공급처 존재여부 확인
    Map<String, Object> findProductById(Long productId);  // 의약품 존재여부 확인
    int countRequestedPo(Long supplierId);               // 중복 발주 확인

    // 발주 단건 조회 (승인,반려용)
    Map<String, Object> findPoStatusById(Long poId);
    // 발주 승인
    int approvePurchaseOrder(Map<String, Object> params);
    // 발주 반려
    int rejectPurchaseOrder(Map<String, Object> params);

}
