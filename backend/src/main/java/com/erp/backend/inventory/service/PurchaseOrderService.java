package com.erp.backend.inventory.service;

import com.erp.backend.common.CustomException;
import com.erp.backend.common.ErrorCode;
import com.erp.backend.inventory.dto.PurchaseOrderDetailDto;
import com.erp.backend.inventory.dto.PurchaseOrderDetailResponseDto;
import com.erp.backend.inventory.dto.PurchaseOrderReqeustDto;
import com.erp.backend.inventory.dto.PurchaseOrderResponseDto;
import com.erp.backend.inventory.mapper.PurchaseOrderMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
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


    // 발주 등록
    @Transactional
    public void createPurchaseOrder(PurchaseOrderReqeustDto requestDto, Long requestEmpId){

        // 공급처 유효성 검사
        Map<String, Object> supplier = purchaseOrderMapper.findSupplierById(requestDto.getSupplierId());
        if (supplier == null){
            throw new CustomException(ErrorCode.SUPPLIER_NOT_FOUND);
        }

        // 중복 발주 방지
        int count = purchaseOrderMapper.countRequestedPo(requestDto.getSupplierId());
        if (count > 0){
            throw new CustomException(ErrorCode.DUPLICATE_ORDER);
        }

        // 의약품 유효성 검사
        for (PurchaseOrderDetailDto detail : requestDto.getDetails()){
            Map<String, Object> product = purchaseOrderMapper.findProductById(detail.getProductId());
            if  (product == null){
                throw new CustomException(ErrorCode.PRODUCT_NOT_FOUND);
            }
        }

        // 총 금액 계산
        BigDecimal totalAmount = requestDto.getDetails().stream()
                .map(d -> d.getUnitPrice()
                        .multiply(BigDecimal.valueOf(d.getOrderQty())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 발주 헤더 INSERT
        Map<String,Object> poParams = new HashMap<>();
        poParams.put("supplierId", requestDto.getSupplierId());
        poParams.put("requestEmpId", requestEmpId);
        poParams.put("totalAmount", totalAmount);
        poParams.put("memo", requestDto.getMemo());
        purchaseOrderMapper.insertPurchaseOrder(poParams);

        // 방금 생선된 PO_ID 조회
        Long poId = purchaseOrderMapper.getCurrentPoId();

        // 발주 상세 INSERT (품목별 반복)
        for (PurchaseOrderDetailDto detail : requestDto.getDetails()) {
            BigDecimal amount = detail.getUnitPrice()
                    .multiply(BigDecimal.valueOf(detail.getOrderQty()));

            Map<String,Object> detailParams = new HashMap<>();
            detailParams.put("poId", poId);
            detailParams.put("productId", detail.getProductId());
            detailParams.put("orderQty", detail.getOrderQty());
            detailParams.put("unitPrice", detail.getUnitPrice());
            detailParams.put("amount", amount);
            purchaseOrderMapper.insertPurchaseOrderDetail(detailParams);
        }
    }

    // 발주 승인
    @Transactional
    public void approvePurchaseOrder (Long poId, Long approveEmpId, String roleCode) {

        // 발주 존재 여부 확인
        Map<String, Object> po = purchaseOrderMapper.findPoStatusById(poId);
        if (po == null){
            throw new CustomException(ErrorCode.PURCHASE_ORDER_NOT_FOUND);
        }
        // 상태 검사
        String status = (String) po.get("STATUS");
        if (!"REQUESTED".equals(status)){
            throw new CustomException(ErrorCode.INVALID_ORDER_STATUS);
        }
        // 본인 발주 승인 방지 (ADMIN 제외)
        Long requestEmpId = ((Number) po.get("REQUEST_EMP_ID")).longValue();
        if (!"ADMIN".equals(roleCode) &&requestEmpId.equals(approveEmpId)){
            throw new CustomException(ErrorCode.SELF_APPROVE_NOT_ALLOWED);
        }

        // 승인 처리
        Map<String, Object> params = new HashMap<>();
        params.put("poId", poId);
        params.put("approveEmpId", approveEmpId);
        int result = purchaseOrderMapper.approvePurchaseOrder(params);
        if (result == 0){
            throw new CustomException(ErrorCode.INVALID_ORDER_STATUS);
        }
    }


    // 발주 반려
    @Transactional
    public void rejectPurchaseOrder (Long poId, Long approveEmpId,
                                     String roleCode, String rejectReason) {

        // 발주 존재 여부 확인
        Map<String, Object> po = purchaseOrderMapper.findPoStatusById(poId);
        if (po == null){
            throw new CustomException(ErrorCode.PURCHASE_ORDER_NOT_FOUND);
        }
        // 상태 검사
        String status = (String) po.get("STATUS");
        if (!"REQUESTED".equals(status)){
            throw new CustomException(ErrorCode.INVALID_ORDER_STATUS);
        }
        // 본인 발주 반려 방지
        Long requestEmpId = ((Number) po.get("REQUEST_EMP_ID")).longValue();
        if (!"ADMIN".equals(roleCode) &&requestEmpId.equals(approveEmpId)){
            throw new CustomException(ErrorCode.SELF_APPROVE_NOT_ALLOWED);
        }

        // 반려 처리
        Map<String, Object> params = new HashMap<>();
        params.put("poId", poId);
        params.put("approveEmpId", approveEmpId);
        params.put("rejectReason", rejectReason);
        int result = purchaseOrderMapper.rejectPurchaseOrder(params);
        if (result == 0){
            throw new CustomException(ErrorCode.INVALID_ORDER_STATUS);
        }
    }

}
