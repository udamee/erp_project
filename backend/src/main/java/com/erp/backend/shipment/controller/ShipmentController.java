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

    @GetMapping
    public ResponseEntity<List<ShipmentVO>> getShipments(@RequestParam(required = false) Integer salesOrderId,
                                                         @RequestParam(required = false) String status,
                                                         @RequestParam(required = false) String employeeName){
        return ResponseEntity.ok(shipmentService.findShipments(salesOrderId,status,employeeName));
    }

    @GetMapping("/{shipmentId}")
    public ResponseEntity<List<ShipmentDetailVO>> getShipmentDetails(@PathVariable int shipmentId, @RequestParam(required = false)String status){
        return ResponseEntity.ok(shipmentService.findShipmentDetails(shipmentId,status));
    }

    @PostMapping("/process")
    public ResponseEntity<Void> processShipment(@RequestParam Integer salesOrderId,@RequestParam Integer employeeId){
        shipmentService.processShipment(salesOrderId,employeeId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{salesOrderId}/verify")
    public ResponseEntity<ApiResponse<SalesOrderRequestVO>> verify(@PathVariable Integer salesOrderId){
        return ResponseEntity.ok(ApiResponse.success("OK",shipmentService.verifyingSalesOrderStatusBySoId(salesOrderId)));
    }

    @GetMapping("/result")
    public ResponseEntity<ApiResponse<List<ShipmentResultVO>>> findShipmentResult(@RequestBody int shipmentId){
        return ResponseEntity.ok(ApiResponse.success("OK",shipmentService.findShipmentResult(shipmentId)));
    }

    @PostMapping("/stock-movement")
    public ResponseEntity<ApiResponse<List<StockMovementSearchVO>>> searchStockMovementHistory(@RequestBody StockMovementSearchVO stockMovementSearchVO){
        return ResponseEntity.ok(ApiResponse.success("OK",shipmentService.searchStockMovementHistory(stockMovementSearchVO)));
    }

    @GetMapping("/history/search")
    public ResponseEntity<ApiResponse<List<ShipmentHistoryVO>>> searchShipmentHistory(@RequestParam int salesOrderId){
        return ResponseEntity.ok(ApiResponse.success("OK",shipmentService.searchShipmentHistory(salesOrderId)));
    }
}
