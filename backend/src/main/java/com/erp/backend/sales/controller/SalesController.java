package com.erp.backend.sales.controller;

import com.erp.backend.common.ApiResponse;
import com.erp.backend.sales.dto.SalesRequestDto;
import com.erp.backend.sales.service.SalesService;
import com.erp.backend.sales.vo.*;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/sales")
public class SalesController {

    private final SalesService salesService;

    @Operation(summary = "매출청구 조회")
    @GetMapping("/invoices")
    public ResponseEntity<ApiResponse<List<SalesInvoiceVO>>> getSalesInvoiceList(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return ResponseEntity.ok(
                ApiResponse.success(salesService.getSalesInvoiceList(status, startDate, endDate))
        );
    }

    @Operation(summary = "매입청구 조회")
    @GetMapping("/purchase-invoices")
    public ResponseEntity<ApiResponse<List<PurchaseInvoiceVO>>> getPurchaseInvoiceList(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return ResponseEntity.ok(
                ApiResponse.success(salesService.getPurchaseInvoiceList(status, startDate, endDate))
        );
    }

    @Operation(summary = "미수금 조회")
    @GetMapping("/receivables")
    public ResponseEntity<ApiResponse<List<AccountReceivableVO>>> getAccountReceivableList(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return ResponseEntity.ok(
                ApiResponse.success(salesService.getAccountReceivableList(status, startDate, endDate))
        );
    }

    @Operation(summary = "미지급금 조회")
    @GetMapping("/payables")
    public ResponseEntity<ApiResponse<List<AccountPayableVO>>> getAccountPayableList(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return ResponseEntity.ok(
                ApiResponse.success(salesService.getAccountPayableList(status, startDate, endDate))
        );
    }

    @Operation(summary = "수금내역 조회")
    @GetMapping("/payments")
    public ResponseEntity<ApiResponse<List<PaymentVO>>> getPaymentList(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return ResponseEntity.ok(
                ApiResponse.success(salesService.getPaymentList(startDate, endDate))
        );
    }

    @Operation(summary = "손익정산 조회")
    @GetMapping("/settlements")
    public ResponseEntity<ApiResponse<List<SettlementVO>>> getSettlementList(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return ResponseEntity.ok(
                ApiResponse.success(salesService.getSettlementList(startDate, endDate))
        );
    }

    @Operation(summary = "매출청구 상세조회")
    @GetMapping("/invoices/{salesInvoiceId}")
    public ResponseEntity<ApiResponse<SalesInvoiceVO>> getSalesInvoice(@PathVariable Long salesInvoiceId) {
        return ResponseEntity.ok(
                ApiResponse.success(salesService.getSalesInvoice(salesInvoiceId))
        );
    }

    @Operation(summary = "매입청구 상세조회")
    @GetMapping("/purchase-invoices/{purchaseInvoiceId}")
    public ResponseEntity<ApiResponse<PurchaseInvoiceVO>> getPurchaseInvoice(@PathVariable Long purchaseInvoiceId) {
        return ResponseEntity.ok(
                ApiResponse.success(salesService.getPurchaseInvoice(purchaseInvoiceId))
        );
    }

    @Operation(summary = "미수금 상세조회")
    @GetMapping("/receivables/{arId}")
    public ResponseEntity<ApiResponse<AccountReceivableVO>> getAccountReceivable(@PathVariable Long arId) {
        return ResponseEntity.ok(
                ApiResponse.success(salesService.getAccountReceivable(arId))
        );
    }

    @Operation(summary = "미지급금 상세조회")
    @GetMapping("/payables/{apId}")
    public ResponseEntity<ApiResponse<AccountPayableVO>> getAccountPayable(@PathVariable Long apId) {
        return ResponseEntity.ok(
                ApiResponse.success(salesService.getAccountPayable(apId))
        );
    }

    @Operation(summary = "수금내역 상세조회")
    @GetMapping("/payments/{paymentId}")
    public ResponseEntity<ApiResponse<PaymentVO>> getPayment(@PathVariable Long paymentId) {
        return ResponseEntity.ok(
                ApiResponse.success(salesService.getPayment(paymentId))
        );
    }

    @Operation(summary = "손익정산 상세조회")
    @GetMapping("/settlements/{settlementId}")
    public ResponseEntity<ApiResponse<SettlementVO>> getSettlement(@PathVariable Long settlementId) {
        return ResponseEntity.ok(
                ApiResponse.success(salesService.getSettlement(settlementId))
        );
    }

    @Operation(summary = "매출청구 등록")
    @PostMapping("/invoices")
    public ResponseEntity<String> createSalesInvoice(@RequestBody SalesRequestDto requestDto) {
        SalesInvoiceVO salesInvoiceVO = new SalesInvoiceVO();
        AccountReceivableVO accountReceivableVO = new AccountReceivableVO();

        salesInvoiceVO.setSoId(requestDto.getSoId());
        salesInvoiceVO.setCustomerId(requestDto.getCustomerId());
        salesInvoiceVO.setIssueDate(requestDto.getIssueDate());
        salesInvoiceVO.setTotalAmount(requestDto.getTotalAmount());
        salesInvoiceVO.setStatus(requestDto.getStatus());

        salesService.createSalesInvoice(
                salesInvoiceVO,
                accountReceivableVO
        );

        return ResponseEntity.ok("매출청구 등록 완료");
    }

    @Operation(summary = "수금 처리")
    @PostMapping("/payments")
    public ResponseEntity<String> createPayment(@RequestBody PaymentVO paymentVO) {
        salesService.createPayment(paymentVO);
        return ResponseEntity.ok("수금 처리 완료");
    }

}