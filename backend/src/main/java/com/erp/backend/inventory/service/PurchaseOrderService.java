package com.erp.backend.inventory.service;

import com.erp.backend.common.CustomException;
import com.erp.backend.common.ErrorCode;
import com.erp.backend.inventory.dto.*;
import com.erp.backend.inventory.mapper.PurchaseOrderMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class PurchaseOrderService {

    private final PurchaseOrderMapper purchaseOrderMapper;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String SUPPLIERS_KEY = "suppliers:active";
    private static final String PRODUCTS_KEY = "products:active";

    // 공급처 목록 조회 (캐싱)
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getSuppliers() {
        // 1. Redis에서 먼저 조회
        Object cached = redisTemplate.opsForValue().get(SUPPLIERS_KEY);
        if (cached != null) {
            log.info("공급처 목록 - 캐시 HIT");
            return (List<Map<String, Object>>) cached;
        }

        // 2. 캐시 없으면 DB 조회
        log.info("공급처 목록 - 캐시 MISS, DB 조회");
        List<Map<String, Object>> suppliers = purchaseOrderMapper.findAllSuppliers();

        // 3. Redis에 저장 (10분 유효)
        redisTemplate.opsForValue().set(SUPPLIERS_KEY, suppliers, Duration.ofMinutes(10));
        return suppliers;
    }


    // 의약품 목록 조회 (페이지 단위 캐싱)
    @SuppressWarnings("unchecked")
    public Map<String, Object> getProducts(int page, int size) {
        int offset = (page - 1) * size;
        String cacheKey = PRODUCTS_KEY + ":" + page + ":" + size;

        Object cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            log.info("의약품 목록 - 캐시 HIT (page={}, size={})", page, size);
            return (Map<String, Object>) cached;
        }

        log.info("의약품 목록 - 캐시 MISS, DB 조회 (page={}, size={})", page, size);
        List<Map<String, Object>> content = purchaseOrderMapper.findAllProducts(offset, size);
        int totalCount = purchaseOrderMapper.countProducts();

        Map<String, Object> result = new HashMap<>();
        result.put("content", content);
        result.put("page", page);
        result.put("size", size);
        result.put("totalCount", totalCount);
        result.put("totalPages", (int) Math.ceil((double) totalCount / size));

        redisTemplate.opsForValue().set(cacheKey, result, Duration.ofDays(1));
        return result;

    }


    public List<Map<String, Object>> searchProducts(String keyword) {
        // 검색어가 비어있으면 빈 목록 반환 (전체 조회 방지)
        if (keyword == null || keyword.isBlank()) {
            return Collections.emptyList();
        }
        return purchaseOrderMapper.searchProducts(keyword.trim());
    }

    // 발주 목록 조회
    public List<Map<String, Object>> getPurchaseOrders(String status, Long supplierId){
        Map<String,Object> params = new HashMap<>();
        params.put("status", status);
        params.put("supplierId", supplierId);
        return purchaseOrderMapper.findAllPurchaseOrders(params);
    }

    // 발주 목록 (페이징)
    public Map<String, Object> getPurchaseOrdersPaging(String status, int page, int size) {
        int startRow = (page - 1) * size + 1;
        int endRow = page * size;

        Map<String, Object> params = new HashMap<>();
        params.put("status", status);
        params.put("startRow", startRow);
        params.put("endRow", endRow);

        List<Map<String, Object>> list = purchaseOrderMapper.findPurchaseOrdersPaging(params);
        int total = purchaseOrderMapper.countPurchaseOrders(params);

        Map<String, Object> result = new HashMap<>();
        result.put("list", list);
        result.put("total", total);
        result.put("page", page);
        result.put("size", size);
        result.put("totalPages", (int) Math.ceil((double) total / size));
        return result;
    }

    // 상태별 개수 (탭 뱃지)
    public Map<String, Integer> getStatusCounts() {
        List<Map<String, Object>> counts = purchaseOrderMapper.countByStatus();
        Map<String, Integer> result = new HashMap<>();
        for (Map<String, Object> row : counts) {
            result.put((String) row.get("status"),
                    ((Number) row.get("count")).intValue());
        }
        return result;
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


    // 발주 등록 (분산 락 적용)
    @Transactional
    public Long createPurchaseOrder(PurchaseOrderRequestDto requestDto, Long requestEmpId) {

        // 분산 락 키 (같은 직원이 같은 공급처에 동시 발주 방지)
        String lockKey = "lock:po:" + requestDto.getSupplierId() + ":" + requestEmpId;

        // 락 획득 시도 (3초 유효)
        Boolean locked = redisTemplate.opsForValue()
                .setIfAbsent(lockKey, "locked", Duration.ofSeconds(3));

        if (Boolean.FALSE.equals(locked)) {
            throw new CustomException(ErrorCode.DUPLICATE_ORDER);
        }

        try {
            // 1. 공급처 유효성 검사
            Map<String, Object> supplier = purchaseOrderMapper.findSupplierById(requestDto.getSupplierId());
            if (supplier == null) {
                throw new CustomException(ErrorCode.SUPPLIER_NOT_FOUND);
            }

            // 2. 중복 발주 방지
            int count = purchaseOrderMapper.countRequestedPo(requestDto.getSupplierId());
            if (count > 0) {
                throw new CustomException(ErrorCode.DUPLICATE_ORDER);
            }

            // 3. 의약품 유효성 검사
            for (PurchaseOrderDetailDto detail : requestDto.getDetails()) {
                Map<String, Object> product = purchaseOrderMapper.findProductById(detail.getProductId());
                if (product == null) {
                    throw new CustomException(ErrorCode.PRODUCT_NOT_FOUND);
                }
            }

            // 4. 총금액 계산
            java.math.BigDecimal totalAmount = requestDto.getDetails().stream()
                    .map(d -> d.getUnitPrice().multiply(java.math.BigDecimal.valueOf(d.getOrderQty())))
                    .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

            // 5. 발주 헤더 INSERT
            Map<String, Object> poParams = new HashMap<>();
            poParams.put("supplierId", requestDto.getSupplierId());
            poParams.put("requestEmpId", requestEmpId);
            poParams.put("totalAmount", totalAmount);
            poParams.put("memo", requestDto.getMemo());
            purchaseOrderMapper.insertPurchaseOrder(poParams);

            // 6. PO_ID 조회
            Long poId = purchaseOrderMapper.getCurrentPoId();

            // 7. 발주 상세 INSERT
            for (PurchaseOrderDetailDto detail : requestDto.getDetails()) {
                java.math.BigDecimal amount = detail.getUnitPrice()
                        .multiply(java.math.BigDecimal.valueOf(detail.getOrderQty()));

                Map<String, Object> detailParams = new HashMap<>();
                detailParams.put("poId", poId);
                detailParams.put("productId", detail.getProductId());
                detailParams.put("orderQty", detail.getOrderQty());
                detailParams.put("unitPrice", detail.getUnitPrice());
                detailParams.put("amount", amount);
                purchaseOrderMapper.insertPurchaseOrderDetail(detailParams);
            }

            return poId;

        } finally {
            // 락 해제
            redisTemplate.delete(lockKey);
        }
    }

    // 캐시 무효화 (의약품·공급처 수정 시 호출)
    public void evictSuppliersCache() {
        redisTemplate.delete(SUPPLIERS_KEY);
        log.info("공급처 캐시 무효화");
    }

    // 캐시 무효화 (의약품 동기화·수정 시 호출)
    public void evictProductsCache() {
        Set<String> keys = redisTemplate.keys(PRODUCTS_KEY + ":*");
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
        }
        log.info("의약품 캐시 무효화");
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
