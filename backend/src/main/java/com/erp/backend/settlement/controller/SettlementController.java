package com.erp.backend.settlement.controller;

import com.erp.backend.common.ApiResponse;
import com.erp.backend.settlement.dto.SalesRequestDto;
import com.erp.backend.settlement.dto.SettlementRequestDto;
import com.erp.backend.settlement.service.SettlementService;
import com.erp.backend.settlement.vo.*;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/settlement")
public class SettlementController {

    private final SettlementService settlementService;

    @Operation(summary = "매출청구 조회")
    @GetMapping("/invoices")
    public ResponseEntity<ApiResponse<List<SalesInvoiceVO>>> getSalesInvoiceList(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return ResponseEntity.ok(
                ApiResponse.success(settlementService.getSalesInvoiceList(status, startDate, endDate))
        );
    }

    @Operation(summary = "매입청구 조회")
    @GetMapping("/purchase-invoices")
    public ResponseEntity<ApiResponse<List<PurchaseInvoiceVO>>> getPurchaseInvoiceList(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return ResponseEntity.ok(
                ApiResponse.success(settlementService.getPurchaseInvoiceList(status, startDate, endDate))
        );
    }

    @Operation(summary = "미수금 조회")
    @GetMapping("/receivables")
    public ResponseEntity<ApiResponse<List<AccountReceivableVO>>> getAccountReceivableList(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return ResponseEntity.ok(
                ApiResponse.success(settlementService.getAccountReceivableList(status, startDate, endDate))
        );
    }

    @Operation(summary = "미지급금 조회")
    @GetMapping("/payables")
    public ResponseEntity<ApiResponse<List<AccountPayableVO>>> getAccountPayableList(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return ResponseEntity.ok(
                ApiResponse.success(settlementService.getAccountPayableList(status, startDate, endDate))
        );
    }

    @Operation(summary = "수금내역 조회")
    @GetMapping("/payments")
    public ResponseEntity<ApiResponse<List<PaymentVO>>> getPaymentList(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return ResponseEntity.ok(
                ApiResponse.success(settlementService.getPaymentList(startDate, endDate))
        );
    }

    @Operation(summary = "손익정산 조회")
    @GetMapping("/settlements")
    public ResponseEntity<ApiResponse<List<SettlementVO>>> getSettlementList(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return ResponseEntity.ok(
                ApiResponse.success(settlementService.getSettlementList(startDate, endDate))
        );
    }

    @Operation(summary = "매출청구 상세조회")
    @GetMapping("/invoices/{salesInvoiceId}")
    public ResponseEntity<ApiResponse<SalesInvoiceVO>> getSalesInvoice(@PathVariable Long salesInvoiceId) {
        return ResponseEntity.ok(
                ApiResponse.success(settlementService.getSalesInvoice(salesInvoiceId))
        );
    }

    @Operation(summary = "매입청구 상세조회")
    @GetMapping("/purchase-invoices/{purchaseInvoiceId}")
    public ResponseEntity<ApiResponse<PurchaseInvoiceVO>> getPurchaseInvoice(@PathVariable Long purchaseInvoiceId) {
        return ResponseEntity.ok(
                ApiResponse.success(settlementService.getPurchaseInvoice(purchaseInvoiceId))
        );
    }

    @Operation(summary = "미수금 상세조회")
    @GetMapping("/receivables/{arId}")
    public ResponseEntity<ApiResponse<AccountReceivableVO>> getAccountReceivable(@PathVariable Long arId) {
        return ResponseEntity.ok(
                ApiResponse.success(settlementService.getAccountReceivable(arId))
        );
    }

    @Operation(summary = "미지급금 상세조회")
    @GetMapping("/payables/{apId}")
    public ResponseEntity<ApiResponse<AccountPayableVO>> getAccountPayable(@PathVariable Long apId) {
        return ResponseEntity.ok(
                ApiResponse.success(settlementService.getAccountPayable(apId))
        );
    }

    @Operation(summary = "수금내역 상세조회")
    @GetMapping("/payments/{paymentId}")
    public ResponseEntity<ApiResponse<PaymentVO>> getPayment(@PathVariable Long paymentId) {
        return ResponseEntity.ok(
                ApiResponse.success(settlementService.getPayment(paymentId))
        );
    }

    @Operation(summary = "손익정산 상세조회")
    @GetMapping("/settlements/{settlementId}")
    public ResponseEntity<ApiResponse<SettlementVO>> getSettlement(@PathVariable Long settlementId) {
        return ResponseEntity.ok(
                ApiResponse.success(settlementService.getSettlement(settlementId))
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

        settlementService.createSalesInvoice(
                salesInvoiceVO,
                accountReceivableVO
        );

        return ResponseEntity.ok("매출청구 등록 완료");
    }

    @Operation(summary = "수금 처리")
    @PostMapping("/payments")
    public ResponseEntity<String> createPayment(@RequestBody PaymentVO paymentVO) {
        settlementService.createPayment(paymentVO);
        return ResponseEntity.ok("수금 처리 완료");
    }

    @Operation(summary = "손익정산 등록")
    @PostMapping("/settlements")
    public ResponseEntity<String> createSettlement(@RequestBody SettlementRequestDto requestDto) {
        settlementService.createSettlement(requestDto);
        return ResponseEntity.ok("손익정산 등록 완료");
    }

    @Operation(summary = "대시보드 조회")
    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardVO>> getDashboardSummary(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) Integer customerId,
            @RequestParam(required = false) Integer itemId) {
        DashboardVO dashboardVO = settlementService.getDashboardSummary(startDate, endDate, customerId, itemId);
        return ResponseEntity.ok(
                ApiResponse.success(dashboardVO)
        );
    }

    @Operation(summary = "기간별 매출 차트 조회")
    @GetMapping("/dashboard/sales-chart")
    public ResponseEntity<ApiResponse<List<SalesChartVO>>> getSalesChart(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) Integer customerId,
            @RequestParam(required = false) Integer itemId) {
        List<SalesChartVO> salesChart = settlementService.getSalesChart(startDate, endDate, customerId, itemId);
        return ResponseEntity.ok(
                ApiResponse.success(salesChart)
        );
    }

    @Operation(summary = "거래처별 매출 TOP 5 조회")
    @GetMapping("/dashboard/customer-top5")
    public ResponseEntity<ApiResponse<List<SalesChartVO>>> getCustomerTop5(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        List<SalesChartVO> customerTop5 = settlementService.getCustomerTop5(startDate, endDate);
        return ResponseEntity.ok(
                ApiResponse.success(customerTop5)
        );
    }

    @Operation(summary = "품목별 매출 TOP 5 조회")
    @GetMapping("/dashboard/product-top5")
    public ResponseEntity<ApiResponse<List<SalesChartVO>>> getProductTop5(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        List<SalesChartVO> productTop5 = settlementService.getProductTop5(startDate, endDate);

        return ResponseEntity.ok(
                ApiResponse.success(productTop5)
        );
    }

}