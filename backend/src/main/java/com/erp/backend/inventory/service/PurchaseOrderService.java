package com.erp.backend.inventory.service;

import com.erp.backend.common.CustomException;
import com.erp.backend.common.ErrorCode;
import com.erp.backend.inventory.dto.PurchaseOrderDetailResponseDto;
import com.erp.backend.inventory.dto.PurchaseOrderResponseDto;
import com.erp.backend.inventory.mapper.PurchaseOrderMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PurchaseOrderService {

    private final PurchaseOrderMapper purchaseOrderMapper;

    // 공급처 목록 조회
    public List<Map<String, Object>> getSuppliers(){
        return purchaseOrderMapper.findAllSuppliers();
    }

    // 의약품 목록 조회
    public List<Map<String, Object>> getProducts(){
        return purchaseOrderMapper.findAllProducts();
    }

    // 발주 목록 조회
    public List<Map<String, Object>> getPurchaseOrders(String status, Long supplierId){
        Map<String,Object> params = new HashMap<>();
        params.put("status", status);
        params.put("supplierId", supplierId);
        return purchaseOrderMapper.findAllPurchaseOrders(params);
    }

    // 발주 상세 조회
    public PurchaseOrderResponseDto getPurchaseOrderById(Long poId){
        // 헤더 조회
        PurchaseOrderResponseDto po = purchaseOrderMapper.findPurchaseOrderById(poId);
        if(po == null){
            throw new CustomException(ErrorCode.NOT_FOUND);
        }
        // 품목 조회 후 세팅
        List<PurchaseOrderDetailResponseDto> details =
                purchaseOrderMapper.findPurchaseOrderDetails(poId);
        po.setDetails(details);
        return po;
    }
}
