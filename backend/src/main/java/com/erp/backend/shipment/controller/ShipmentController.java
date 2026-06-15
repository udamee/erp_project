package com.erp.backend.shipment.controller;

import com.erp.backend.shipment.Util.ShipmentStatus;
import com.erp.backend.shipment.service.ShipmentService;
import com.erp.backend.shipment.vo.ShipmentDetailVO;
import com.erp.backend.shipment.vo.ShipmentVO;
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
}
