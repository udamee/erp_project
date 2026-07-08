package com.erp.backend.refundItem.controller;

import com.erp.backend.common.ApiResponse;
import com.erp.backend.refundItem.service.RefundItemService;
import com.erp.backend.refundItem.vo.ReturnedItemRequestVO;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.tags.Tags;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/refund-item")
@RequiredArgsConstructor
@Tag(name = "반품",description = "반품 관련 API")
public class RefundItemController {

    private final RefundItemService refundItemService;

    @GetMapping("/targets/{salesOrderId}")
    public ResponseEntity<ApiResponse<List<ReturnedItemRequestVO>>> findReturnTargets(@PathVariable int salesOrderId) {
        List<ReturnedItemRequestVO> result = refundItemService.findReturnRequestTarget(salesOrderId);
        if (result != null && !result.isEmpty()){
            return ResponseEntity.ok(ApiResponse.success(result.size() + " 의 건이 조회되었습니다",result));
        }
        return ResponseEntity.ok(ApiResponse.fail("조회 실패"));
    }

    @GetMapping("/returnable-qty/{shipmentDetailId}")
    public ResponseEntity<ApiResponse<Integer>> findReturnableQty(@PathVariable int shipmentDetailId) {
        int result = refundItemService.checkReturnableItemAmount(shipmentDetailId);
        if (result > 0) {
            return ResponseEntity.ok(ApiResponse.success(result+" 개가 반품가능합니다",result));
        }
        return ResponseEntity.ok(ApiResponse.fail("반품 가능 개수 없음"));
    }

    @PostMapping("/request")
    public ResponseEntity<ApiResponse<Integer>> requestReturn(@RequestBody List<ReturnedItemRequestVO> requestItems, @RequestParam int empId) {
        int returnGroupId = refundItemService.requestReturn(requestItems, empId);
        if (returnGroupId > 0) {
            return ResponseEntity.ok(ApiResponse.success(returnGroupId+"반품그룹번호",returnGroupId));
        }
        return ResponseEntity.ok(ApiResponse.fail(""));
    }

    @PutMapping("/{returnGroupId}/approve")
    public ResponseEntity<ApiResponse<Void>> approveReturn(@PathVariable int returnGroupId, @RequestParam int empId) {
        if(refundItemService.approveReturn(returnGroupId, empId)){
            return ResponseEntity.ok(ApiResponse.success("요청승인",null));
        }
        return ResponseEntity.ok(ApiResponse.fail("실패"));
    }

    @PutMapping("/{returnGroupId}/reject")
    public ResponseEntity<ApiResponse<Void>> rejectReturn(@PathVariable int returnGroupId, @RequestParam String rejectReason) {

        if(refundItemService.rejectReturn(returnGroupId, rejectReason)){
            return ResponseEntity.ok(ApiResponse.success("반품 거절",null));
        }
        return ResponseEntity.ok(ApiResponse.fail("실패"));
    }

    @PutMapping("/{returnGroupId}/complete")
    public ResponseEntity<ApiResponse<BigDecimal>> completeReturn(@PathVariable int returnGroupId, @RequestParam int empId) {
        BigDecimal refundAmount = refundItemService.completeReturn(returnGroupId, empId);
        if (refundAmount != null && refundAmount.compareTo(BigDecimal.ZERO) > 0) {
            return ResponseEntity.ok(ApiResponse.success(refundAmount + "반품 금액",refundAmount));
        }
        return ResponseEntity.ok(ApiResponse.fail(null));
    }

    @GetMapping("/{returnGroupId}")
    public ResponseEntity<ApiResponse<List<ReturnedItemRequestVO>>> findReturnRequestGroup(@PathVariable int returnGroupId) {
        List<ReturnedItemRequestVO> details = refundItemService.findReturnRequestsByGroupId(returnGroupId);
        if (details != null && !details.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.success(details));
        }
        return ResponseEntity.ok(ApiResponse.fail("조회 실패"));
    }
}