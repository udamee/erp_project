package com.erp.backend.sales.controller;


import com.erp.backend.common.ApiResponse;
import com.erp.backend.common.PageResponse;
import com.erp.backend.sales.dto.SalesOrderListResponseDTO;
import com.erp.backend.sales.dto.SalesOrderRequestDTO;
import com.erp.backend.sales.service.SalesOrderService;
import com.erp.backend.sales.vo.*;
import lombok.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sales-order")

public class SalesOrderController {

    private final SalesOrderService salesOrderService;

    @Autowired
    public SalesOrderController(SalesOrderService salesOrderService){
        this.salesOrderService = salesOrderService;
    }

    //주문전체조회
    @GetMapping("/paging")
    public ResponseEntity<ApiResponse<PageResponse<SalesOrderListResponseDTO>>> findAllSalesOrders(@RequestParam(required = false) String status,
                                                                                                   @RequestParam(defaultValue = "1") Integer offset,
                                                                                                   @RequestParam(defaultValue = "10") Integer size) {
        size = salesOrderService.findCountsForSalesOrders(status);
        PageResponse<SalesOrderListResponseDTO> result = salesOrderService.findALllSalesOrdersPaging(status, offset, size);
        return ResponseEntity.ok(ApiResponse.success(result.getSize()+"의건이 조회되었습니다",result));
    }

    @GetMapping("/status-count")
    public ResponseEntity<ApiResponse<Map<String,Integer>>> getCountByStatus(){
        Map<String,Integer> result = salesOrderService.findCountsByStatus();
        return ResponseEntity.ok(ApiResponse.success("상태별 갯수",result));
    }

    //주문 조회 1건
    @GetMapping("/{salesOrderId}")
    public ResponseEntity<ApiResponse<SalesOrderVO>> findSalesOrder(@PathVariable Integer salesOrderId){
        SalesOrderVO order = salesOrderService.findSalesOrderById(salesOrderId);
        return ResponseEntity.ok(ApiResponse.success("주문번호 "+order.getSoId()+" 의 주문이 조회되었습니다",order));
    }

    //상품별 로트조회
    @GetMapping("/productLots")
    public ResponseEntity<ApiResponse<List<ProductVO>>> findProductLot(@RequestParam int productId){
        List<ProductVO> result = salesOrderService.findProductLotsByProductId(productId);
        return ResponseEntity.ok(ApiResponse.success(result.size()+"개의 로트가 조회되었습니다",result));
    }

    //상품별 이용가능한 로트조회
    @GetMapping("/products/available-lots")
    public ResponseEntity<ApiResponse<List<ProductVO>>> findAvailableLotStock(@RequestParam int productId){
        List<ProductVO> item = salesOrderService.findAvailableProducts(productId);
        return ResponseEntity.ok(ApiResponse.success(item.size()+"개의 로트가 이용가능합니다",item));
    }

    //주문상세조회
    @GetMapping("/{salesOrderId}/details")
    public ResponseEntity<ApiResponse<SalesOrderVO>> findSalesOrderDetailList(@PathVariable Integer salesOrderId){
        SalesOrderVO order = salesOrderService.findSalesOrderWithDetails(salesOrderId);
        return ResponseEntity.ok(ApiResponse.success(order.getDetailList().size()+"개의 상세정보가 조회되었습니다",order));
    }

    //주문생성
    @PostMapping
    public ResponseEntity<ApiResponse<SalesOrderVO>> makeOrder(@RequestBody SalesOrderRequestDTO requestDTO){
        SalesOrderVO responseVO = salesOrderService.makeOrder(requestDTO);
        return ResponseEntity.ok(ApiResponse.success("주문이 생성되었습니다",responseVO));
    }

    //주문승인
    @PatchMapping("/{salesOrderId}/approve")
    public ResponseEntity<ApiResponse<SalesOrderVO>> approveRequest(@PathVariable int salesOrderId,@RequestBody SalesOrderRequestDTO request){
        SalesOrderVO salesOrderVO = new SalesOrderVO();
        salesOrderVO.setSoId(salesOrderId);
        salesOrderVO.setAppEmployeeId(request.getEmployeeId());
        SalesOrderVO updateSalesOrder = salesOrderService.approveRequest(salesOrderVO);
        return ResponseEntity.ok(ApiResponse.success("주문이 승인되었습니다",updateSalesOrder));
    }

    //주문금액검증
    @GetMapping("/{salesOrderId}/amount-check")
    public ResponseEntity<ApiResponse<SalesOrderAmountCheckVO>> checkView(@PathVariable int salesOrderId){
        SalesOrderAmountCheckVO salesOrderAmountCheckVO = salesOrderService.verifyAmount(salesOrderId);
        return ResponseEntity.ok(ApiResponse.success("액수가 일치합니다",salesOrderAmountCheckVO));
    }

    @GetMapping("/customers")
    public ResponseEntity<ApiResponse<List<SalesOrderVO>>> findAllCustomer(){
        List<SalesOrderVO> customers = salesOrderService.findAllCustomers();
        return ResponseEntity.ok(ApiResponse.success("판매처를 조회했습니다",customers));
    }

    @GetMapping("/products")
    public ResponseEntity<ApiResponse<List<ProductVO>>> findAllProducts(){
        List<ProductVO> results = salesOrderService.findAllAvailableActiveProducts();
        return ResponseEntity.ok(ApiResponse.success("의약품을 조회했습니다",results));
    }

}
