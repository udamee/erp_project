package com.erp.backend.inventory.controller;

import com.erp.backend.common.ApiResponse;
import com.erp.backend.common.AuthUtil;
import com.erp.backend.inventory.dto.ReceivingDetailResponseDto;
import com.erp.backend.inventory.dto.ReceivingRequestDto;
import com.erp.backend.inventory.service.ReceivingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "입고 관리", description = "입고 처리 API")
@RestController
@RequestMapping("/api/receivings")
@RequiredArgsConstructor
public class ReceivingController {

    private final ReceivingService receivingService;

    @Operation(summary = "입고 가능 목록 조회 (APPROVED 상태 발주)")
    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getReceivableOrders() {
        return ResponseEntity.ok(
                ApiResponse.success(receivingService.getReceivableOrders()));
    }

    @Operation(summary = "발주 기준 입고 품목 조회")
    @GetMapping("/{poId}/details")
    public ResponseEntity<ApiResponse<List<ReceivingDetailResponseDto>>> getReceivingDetails(
            @PathVariable Long poId) {
        return ResponseEntity.ok(
                ApiResponse.success(receivingService.getReceivingDetailsByPoId(poId)));
    }

    @Operation(summary = "입고 처리")
    @PostMapping
    public ResponseEntity<ApiResponse<Void>> processReceiving(
            @Valid @RequestBody ReceivingRequestDto requestDto,
            @AuthenticationPrincipal Long empId) {

        receivingService.processReceiving(requestDto, empId);
        return ResponseEntity.ok(ApiResponse.success("입고 처리가 완료되었습니다.", null));
    }
}
