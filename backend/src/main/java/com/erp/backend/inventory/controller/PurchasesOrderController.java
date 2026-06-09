package com.erp.backend.inventory.controller;

import com.erp.backend.common.ApiResponse;
import com.erp.backend.inventory.dto.PurchaseOrderReqeustDto;
import com.erp.backend.inventory.dto.PurchaseOrderResponseDto;
import com.erp.backend.inventory.service.PurchaseOrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name="발주 관리", description = "사입 발주 등록·승인·반려 API")
@RestController
@RequestMapping("/api/purchase-orders")
@RequiredArgsConstructor
public class PurchasesOrderController {

    private final PurchaseOrderService purchaseOrderService;

    @Operation(summary = "공급처 목록 조회")
    @GetMapping("/suppliers")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getSuppliers() {
        return ResponseEntity.ok(
                ApiResponse.success(purchaseOrderService.getSuppliers()));
    }

    @Operation(summary = "의약품 목록 조회")
    @GetMapping("/products")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getProducts() {
        return ResponseEntity.ok(
                ApiResponse.success(purchaseOrderService.getProducts()));
    }

    @Operation(summary = "발주 목록 조회")
    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getProductsBySupplierId(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long supplierId) {
        return ResponseEntity.ok(
                ApiResponse.success(purchaseOrderService.getPurchaseOrders(status, supplierId))
        );
    }

    @Operation(summary = "발주 상세 조회")
    @GetMapping("/{poId}")
    public ResponseEntity<ApiResponse<PurchaseOrderResponseDto>> getPurchaseOrder(
            @PathVariable Long poId) {
        return ResponseEntity.ok(
                ApiResponse.success(purchaseOrderService.getPurchaseOrderById(poId)));
    }
}
