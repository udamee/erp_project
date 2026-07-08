package com.erp.backend.shipment.controller;

import com.erp.backend.common.ApiResponse;
import com.erp.backend.common.PageResponse;
import com.erp.backend.shipment.service.ShipmentService;
import com.erp.backend.shipment.vo.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/shipment")
public class ShipmentController {

    private final ShipmentService shipmentService;

    @Autowired
    public ShipmentController(ShipmentService shipmentService) {
        this.shipmentService = shipmentService;
    }

    //출고 목록 조회
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ShipmentVO>>> getShipments(@RequestParam(required = false) Integer salesOrderId,
                                                                              @RequestParam(required = false) String status,
                                                                              @RequestParam(required = false) String employeeName,
                                                                              @RequestParam(defaultValue = "1") Integer page,
                                                                              @RequestParam(defaultValue = "10") Integer size) {
        PageResponse<ShipmentVO> result = shipmentService.findShipments(salesOrderId, status, employeeName, page, size);
        return ResponseEntity.ok(ApiResponse.success(result.getSize() + "의건이 조회되었습니다", result));
    }

    @GetMapping("/status-count")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> getCountByStatus() {
        Map<String, Integer> result = shipmentService.findCountsByStatus();
        return ResponseEntity.ok(ApiResponse.success("상태별 갯수", result));
    }

    //출고 상세 조회
    @GetMapping("/{shipmentId}")
    public ResponseEntity<ApiResponse<List<ShipmentDetailVO>>> getShipmentDetails(@PathVariable int shipmentId, @RequestParam(required = false) String status) {
        return ResponseEntity.ok(ApiResponse.success(shipmentService.findShipmentDetails(shipmentId, status)));
    }

    //출고 처리
    @PostMapping("/process")
    public ResponseEntity<ApiResponse<Integer>> processShipment(@RequestParam Integer salesOrderId, @AuthenticationPrincipal long employeeId) {
        int shipmentId = shipmentService.processShipment(salesOrderId, employeeId);
        return ResponseEntity.ok(ApiResponse.success("출고 처리 완료", shipmentId));
    }

    //출고 가능 주문 검증
    @GetMapping("/verify/{salesOrderId}")
    public ResponseEntity<ApiResponse<List<SalesOrderRequestVO>>> verify(@PathVariable Integer salesOrderId) {
        return ResponseEntity.ok(ApiResponse.success("OK", shipmentService.verifyingSalesOrderStatusBySoId(salesOrderId)));
    }

    //출고 결과 조회
    @GetMapping("/result/{shipmentId}")
    public ResponseEntity<ApiResponse<List<ShipmentResultVO>>> findShipmentResult(@PathVariable int shipmentId) {
        return ResponseEntity.ok(ApiResponse.success("OK", shipmentService.findShipmentResult(shipmentId)));
    }

    //재고 변동 이력 조회
    @PostMapping("/stock-movement")
    public ResponseEntity<ApiResponse<List<StockMovementSearchVO>>> searchStockMovementHistory(@RequestBody(required = false) StockMovementSearchVO stockMovementSearchVO) {
        return ResponseEntity.ok(ApiResponse.success("OK", shipmentService.searchStockMovementHistory(stockMovementSearchVO)));
    }

    //로트별 재고 조회
    @GetMapping("/lot-stock")
    public ResponseEntity<ApiResponse<List<StockMovementSearchVO>>> findLotStockList() {
        List<StockMovementSearchVO> result = shipmentService.findLotStockList();

        return ResponseEntity.ok(ApiResponse.success(result.size() + "개의 로트별 재고가 조회되었습니다.", result)
        );
    }

    //주문별 출고 이력 조회
    @GetMapping("/history/search")
    public ResponseEntity<ApiResponse<List<ShipmentHistoryVO>>> searchShipmentHistory(@RequestParam int salesOrderId) {
        return ResponseEntity.ok(ApiResponse.success("OK", shipmentService.searchShipmentHistory(salesOrderId)));
    }

    //상품별 재고 조회
    @GetMapping("/product-stock")
    public ResponseEntity<ApiResponse<List<ProductStockVO>>> findProductStock() {
        List<ProductStockVO> result = shipmentService.findProductStockList();
        return ResponseEntity.ok(ApiResponse.success(result.size() + "개의 상품별 재고가 조회되었습니다.", result));
    }
}
