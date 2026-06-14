package com.erp.backend.sales.controller;


import com.erp.backend.sales.dto.SalesOrderRequestDTO;
import com.erp.backend.sales.service.SalesOrderService;
import com.erp.backend.sales.vo.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sales-order")

public class SalesOrderController {

    private final SalesOrderService salesOrderService;

    @Autowired
    public SalesOrderController(SalesOrderService salesOrderService){
        this.salesOrderService = salesOrderService;
    }

    @GetMapping("/productLots")
    public ResponseEntity<List<ProductVO>> findProductLot(@RequestParam int productId){
        List<ProductVO> result = salesOrderService.findProductLotsByProductId(productId);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/products/available-lots")
    public ResponseEntity<List<ProductVO>> findAvailableLotStock(@RequestParam int productId){
        List<ProductVO> item = salesOrderService.findAvailableProducts(productId);
        return ResponseEntity.ok(item);
    }

    @GetMapping("/{salesOrderId}/status")
    public ResponseEntity<List<SalesOrderVO>> findRequestOrder(@PathVariable int salesOrderId){
        List<SalesOrderVO> orders = salesOrderService.findRequestOrder(salesOrderId);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/status")
    public ResponseEntity<List<SalesOrderVO>> findAllOrderStatus(){
        List<SalesOrderVO> orders = salesOrderService.findAllOrderStatusList();
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/{salesOrderId}/header")
    public ResponseEntity<SalesOrderVO> findSimpleOrderHeader(@PathVariable Integer salesOrderId){
        SalesOrderVO order = salesOrderService.findSalesOrderHeaderById(salesOrderId);
        return ResponseEntity.ok(order);
    }

    @GetMapping("/{salesOrderId}/details")
    public ResponseEntity<SalesOrderVO> findSimpleOrderDetailList(@PathVariable Integer salesOrderId){
        SalesOrderVO order = salesOrderService.findOrderDetailListByOrderId(salesOrderId);
        return ResponseEntity.ok(order);
    }

    @PostMapping
    public ResponseEntity<Void> makeOrder(@RequestBody SalesOrderRequestDTO requestDTO){
        salesOrderService.makeOrder(requestDTO);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{salesOrderId}/approve")
    public ResponseEntity<SalesOrderVO> approveRequest(@PathVariable int salesOrderId,@RequestBody SalesOrderRequestDTO requestDTO){
        SalesOrderVO salesOrderVO = new SalesOrderVO();
        salesOrderVO.setSoId(salesOrderId);
        salesOrderVO.setAppEmployeeId(requestDTO.getEmployeeId());
        SalesOrderVO updateSalesOrder = salesOrderService.approveRequest(salesOrderVO);
        System.out.println(updateSalesOrder);
        return ResponseEntity.ok(updateSalesOrder);
    }

    @GetMapping("/{salesOrderId}/amount-check")
    public ResponseEntity<SalesOrderAmountCheckVO> checkView(@PathVariable int salesOrderId){
        SalesOrderAmountCheckVO salesOrderAmountCheckVO = salesOrderService.verifyAmount(salesOrderId);
        return ResponseEntity.ok(salesOrderAmountCheckVO);
    }

    @GetMapping("/lots")
    public ResponseEntity<List<ItemLotVO>> availableLots(){
        return ResponseEntity.ok().build();
    }

//    @GetMapping("/status")
//    public ResponseEntity<Void> checkStatus(@RequestParam int salesOrderId,@RequestParam String status){
//        salesOrderService.findStatus(salesOrderId,"");
//        return ResponseEntity.ok().build();
//    }





}
