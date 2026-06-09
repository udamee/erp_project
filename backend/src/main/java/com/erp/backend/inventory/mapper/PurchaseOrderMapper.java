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

    // 발주 상세조회
    PurchaseOrderResponseDto findPurchaseOrderById(Long id);
    List<PurchaseOrderDetailResponseDto> findPurchaseOrderDetails(Long poId);
    Long getCurrentPoid();
}
