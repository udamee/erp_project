package com.erp.backend.shipment.controller;

import com.erp.backend.common.ApiResponse;
import com.erp.backend.shipment.service.ShipmentService;
import com.erp.backend.shipment.vo.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shipment")
public class ShipmentController {

    private final ShipmentService shipmentService;

    @Autowired
    public ShipmentController(ShipmentService shipmentService){
        this.shipmentService = shipmentService;
    }

    //출고 목록 조회
    @GetMapping
    public ResponseEntity<List<ShipmentVO>> getShipments(@RequestParam(required = false) Integer salesOrderId,
                                                         @RequestParam(required = false) String status,
                                                         @RequestParam(required = false) String employeeName){
        return ResponseEntity.ok(shipmentService.findShipments(salesOrderId,status,employeeName));
    }

    //출고 상세 조회
    @GetMapping("/{shipmentId}")
    public ResponseEntity<List<ShipmentDetailVO>> getShipmentDetails(@PathVariable int shipmentId, @RequestParam(required = false)String status){
        return ResponseEntity.ok(shipmentService.findShipmentDetails(shipmentId,status));
    }

    //출고 처리
    @PostMapping("/process")
    public ResponseEntity<Void> processShipment(@RequestParam Integer salesOrderId,@RequestParam Integer employeeId){
        shipmentService.processShipment(salesOrderId,employeeId);
        return ResponseEntity.ok().build();
    }

    //출고 가능 주문 검증
    @GetMapping("/verify/{salesOrderId}")
    public ResponseEntity<ApiResponse<List<SalesOrderRequestVO>>> verify(@PathVariable Integer salesOrderId){
        return ResponseEntity.ok(ApiResponse.success("OK",shipmentService.verifyingSalesOrderStatusBySoId(salesOrderId)));
    }

    //출고 결과 조회
    @GetMapping("/result/{shipmentId}")
    public ResponseEntity<ApiResponse<List<ShipmentResultVO>>> findShipmentResult(@PathVariable int shipmentId){
        return ResponseEntity.ok(ApiResponse.success("OK",shipmentService.findShipmentResult(shipmentId)));
    }

    //재고 변동 이력 조회
    @PostMapping("/stock-movement")
    public ResponseEntity<ApiResponse<List<StockMovementSearchVO>>> searchStockMovementHistory(@RequestBody(required = false) StockMovementSearchVO stockMovementSearchVO){
        return ResponseEntity.ok(ApiResponse.success("OK",shipmentService.searchStockMovementHistory(stockMovementSearchVO)));
    }

    //주문별 출고 이력 조회
    @GetMapping("/history/search")
    public ResponseEntity<ApiResponse<List<ShipmentHistoryVO>>> searchShipmentHistory(@RequestParam int salesOrderId){
        return ResponseEntity.ok(ApiResponse.success("OK",shipmentService.searchShipmentHistory(salesOrderId)));
    }
}
