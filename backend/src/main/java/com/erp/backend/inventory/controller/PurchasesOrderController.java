package com.erp.backend.inventory.controller;

import com.erp.backend.common.ApiResponse;
import com.erp.backend.common.AuthUtil;
import com.erp.backend.inventory.dto.PurchaseOrderApproveRequestDto;
import com.erp.backend.inventory.dto.PurchaseOrderRequestDto;
import com.erp.backend.inventory.dto.PurchaseOrderResponseDto;
import com.erp.backend.inventory.service.PurchaseOrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name="발주 관리", description = "사입 발주 등록·승인·반려 API")
@RestController
@RequestMapping("/api/purchase-orders")
@RequiredArgsConstructor
public class PurchasesOrderController {

    private final PurchaseOrderService purchaseOrderService;
    private final AuthUtil authUtil;

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

    @Operation(summary = "발주 등록 (STAFF)")
    @PostMapping
    public ResponseEntity<ApiResponse<Void>> createPurchaseOrder(
            @Valid @RequestBody PurchaseOrderRequestDto requestDto,
            @AuthenticationPrincipal String loginId) {

        Long empId = authUtil.getEmpId(loginId); // loginID로 empId 조회
        purchaseOrderService.createPurchaseOrder(requestDto, empId);
        return ResponseEntity.ok(ApiResponse.success("발주가 등록되었습니다.",null));
    }


    @Operation(summary = "발주 승인 (MANAGER)")
    @PutMapping("/{poId}/approve")
    public ResponseEntity<ApiResponse<Void>> approvePurchaseOrder(
            @PathVariable Long poId,
            @AuthenticationPrincipal String loginId,
            Authentication authentication) {

        Long empId = authUtil.getEmpId(loginId);

        String roleCode = authentication.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .orElse("");

        purchaseOrderService.approvePurchaseOrder(poId, empId, roleCode);
        return ResponseEntity.ok(ApiResponse.success("발주가 승인되었습니다.",null));
    }

    @Operation(summary = "발주 반려 (MANAGER)")
    @PutMapping("/{poId}/reject")
    public ResponseEntity<ApiResponse<Void>> rejectPurchaseOrder(
            @PathVariable Long poId,
            @Valid @RequestBody PurchaseOrderApproveRequestDto requestDto,
            @AuthenticationPrincipal String loginId, Authentication authentication) {

        Long empId = authUtil.getEmpId(loginId);

        String roleCode = authentication.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .orElse("");

        purchaseOrderService.rejectPurchaseOrder(poId, empId, roleCode,requestDto.getRejectReason());
        return ResponseEntity.ok(ApiResponse.success("발주가 반려되었습니다.",null));
    }
}
