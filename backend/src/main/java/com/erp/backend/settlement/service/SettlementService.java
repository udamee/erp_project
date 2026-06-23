package com.erp.backend.settlement.service;

import com.erp.backend.settlement.dto.SettlementRequestDto;
import com.erp.backend.settlement.mapper.SettlementMapper;
import com.erp.backend.settlement.vo.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SettlementService {

    private final SettlementMapper settlementMapper;

    // 매출청구 조회
    public List<SalesInvoiceVO> getSalesInvoiceList(
            String status, String startDate, String endDate) {
        Map<String, Object> params = new HashMap<>();
        params.put("status", status);
        params.put("startDate", startDate);
        params.put("endDate", endDate);
        return settlementMapper.findAllSalesInvoices(params);
    }

    // 매입청구 조회
    public List<PurchaseInvoiceVO> getPurchaseInvoiceList(
            String status, String startDate, String endDate) {
        Map<String, Object> params = new HashMap<>();
        params.put("status", status);
        params.put("startDate", startDate);
        params.put("endDate", endDate);
        return settlementMapper.findAllPurchaseInvoices(params);
    }

    // 미수금/매출채권 조회
    public List<AccountReceivableVO> getAccountReceivableList(
            String status, String startDate, String endDate) {
        Map<String, Object> params = new HashMap<>();
        params.put("status", status);
        params.put("startDate", startDate);
        params.put("endDate", endDate);
        return settlementMapper.findAllAccountReceivables(params);
    }

    // 미지급금/매입채무 조회
    public List<AccountPayableVO> getAccountPayableList(
            String status, String startDate, String endDate) {
        Map<String, Object> params = new HashMap<>();
        params.put("status", status);
        params.put("startDate", startDate);
        params.put("endDate", endDate);
        return settlementMapper.findAllAccountPayables(params);
    }

    // 수금내역 조회
    public List<PaymentVO> getPaymentList(
            String startDate, String endDate) {
        Map<String, Object> params = new HashMap<>();
        params.put("startDate", startDate);
        params.put("endDate", endDate);
        return settlementMapper.findAllPayments(params);
    }

    // 손익정산 조회
    public List<SettlementVO> getSettlementList(
            String startDate, String endDate) {
        Map<String, Object> params = new HashMap<>();
        params.put("startDate", startDate);
        params.put("endDate", endDate);
        return settlementMapper.findAllSettlements(params);
    }

    // 매출청구 상세조회
    public SalesInvoiceVO getSalesInvoice(Long salesInvoiceId) {
        return settlementMapper.findSalesInvoiceById(salesInvoiceId);
    }

    // 매입청구 상세조회
    public PurchaseInvoiceVO getPurchaseInvoice(Long purchaseInvoiceId) {
        return settlementMapper.findPurchaseInvoiceById(purchaseInvoiceId);
    }

    // 미수금 상세조회
    public AccountReceivableVO getAccountReceivable(Long arId) {
        return settlementMapper.findAccountReceivableById(arId);
    }

    // 미지급금 상세조회
    public AccountPayableVO getAccountPayable(Long apId) {
        return settlementMapper.findAccountPayableById(apId);
    }

    // 수금내역 상세조회
    public PaymentVO getPayment(Long paymentId) {
        return settlementMapper.findPaymentById(paymentId);
    }

    // 손익정산 상세조회
    public SettlementVO getSettlement(Long settlementId) {
        return settlementMapper.findSettlementById(settlementId);
    }


    @Transactional
    public void createSalesInvoice(SalesInvoiceVO salesInvoiceVO, AccountReceivableVO accountReceivableVO) {
        // 매출청구 금액 유효성 검사
        if (salesInvoiceVO.getTotalAmount() == null || salesInvoiceVO.getTotalAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("매출청구 금액은 0보다 커야 합니다.");
        }
        // 여신한도 임시 설정: 500만원
        BigDecimal creditLimit = new BigDecimal("5000000");
        // 거래처 현재 미수금 조회
        BigDecimal currentReceivable = settlementMapper.findCurrentReceivableAmount(salesInvoiceVO.getCustomerId());
        // 현재 미수금 + 신규 매출청구 금액
        BigDecimal expectedReceivable = currentReceivable.add(salesInvoiceVO.getTotalAmount());
        // 여신한도 초과 여부 확인
        if (expectedReceivable.compareTo(creditLimit) > 0) {
            throw new RuntimeException("여신한도를 초과하여 매출청구를 등록할 수 없습니다.");
        }
        // 매출청구 등록
        settlementMapper.insertSalesInvoice(salesInvoiceVO);
        // 생성된 매출청구 ID를 미수금 정보에 설정
        accountReceivableVO.setSalesInvoiceId(salesInvoiceVO.getSalesInvoiceId());
        // 미수금 등록에 필요한 정보 설정
        accountReceivableVO.setCustomerId(salesInvoiceVO.getCustomerId());
        accountReceivableVO.setTotalAmount(salesInvoiceVO.getTotalAmount());
        accountReceivableVO.setPaidAmount(BigDecimal.ZERO);
        accountReceivableVO.setRemainAmount(salesInvoiceVO.getTotalAmount());
        accountReceivableVO.setStatus("UNPAID");
        accountReceivableVO.setDueDate(salesInvoiceVO.getIssueDate().plusDays(30));
        // 미수금 등록
        settlementMapper.insertAccountReceivable(accountReceivableVO);
    }

    // 수금 처리
    @Transactional
    public void createPayment(PaymentVO paymentVO) {
        // 수금 금액 유효성 검사
        BigDecimal remainAmount = settlementMapper.findRemainAmountByArId(paymentVO.getArId());
        if (remainAmount == null) {
            throw new RuntimeException("해당 미수금 정보를 찾을 수 없습니다.");
        }
        if (paymentVO.getPaymentAmount().compareTo(remainAmount) > 0) {
            throw new RuntimeException("수금 금액은 미수금보다 클 수 없습니다.");
        }
        if (paymentVO.getPaymentAmount() == null || paymentVO.getPaymentAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("수금 금액은 0보다 커야 합니다.");
        }
        settlementMapper.insertPayment(paymentVO);
        settlementMapper.updateAccountReceivablePayment(paymentVO);
    }

    // 손익정산 등록
    @Transactional
    public void createSettlement(SettlementRequestDto requestDto) {
        Map<String, Object> params = new HashMap<>();
        params.put("startDate", requestDto.getStartDate());
        params.put("endDate", requestDto.getEndDate());

        BigDecimal totalSales = settlementMapper.findTotalSalesAmount(params);
        BigDecimal totalPurchase = settlementMapper.findTotalPurchaseAmount(params);
        BigDecimal totalReceivable = settlementMapper.findTotalReceivableAmount(params);
        BigDecimal totalPayable = settlementMapper.findTotalPayableAmount(params);

        BigDecimal grossProfit = totalSales.subtract(totalPurchase);
        BigDecimal profitRate = BigDecimal.ZERO;

        if (totalSales.compareTo(BigDecimal.ZERO) > 0) {
            profitRate = grossProfit.divide(totalSales, 4, RoundingMode.HALF_UP)
                                    .multiply(new BigDecimal("100"));
        }

        SettlementVO settlementVO = new SettlementVO();
        settlementVO.setStartDate(requestDto.getStartDate());
        settlementVO.setEndDate(requestDto.getEndDate());
        settlementVO.setTotalPurchase(totalPurchase);
        settlementVO.setTotalSales(totalSales);
        settlementVO.setTotalReceivable(totalReceivable);
        settlementVO.setTotalPayable(totalPayable);
        settlementVO.setGrossProfit(grossProfit);
        settlementVO.setProfitRate(profitRate);
        settlementVO.setCreatedBy(requestDto.getCreatedBy());

        settlementMapper.insertSettlement(settlementVO);
    }

    @Transactional
    public void createPurchaseInvoiceForCompletedOrder(Long poId) {
        Map<String, Object> params = new HashMap<>();
        params.put("poId", poId);

        int invoiceResult = settlementMapper.insertPurchaseInvoiceFromPurchaseOrder(params);
        if (invoiceResult != 1 || params.get("purchaseInvoiceId") == null) {
            throw new IllegalStateException("매입전표 생성에 실패했습니다. poId=" + poId);
        }

        Integer purchaseInvoiceId = ((Number) params.get("purchaseInvoiceId")).intValue();
        int payableResult = settlementMapper.insertAccountPayableFromPurchaseInvoice(purchaseInvoiceId);
        if (payableResult != 1) {
            throw new IllegalStateException("매입채무 생성에 실패했습니다. purchaseInvoiceId=" + purchaseInvoiceId);
        }
    }

    // 대시보드 조회
    public DashboardVO getDashboardSummary(
            String startDate,
            String endDate,
            Integer customerId,
            Integer itemId) {
        Map<String, Object> params = new HashMap<>();
        params.put("startDate", startDate);
        params.put("endDate", endDate);
        params.put("customerId", customerId);
        params.put("itemId", itemId);

        return settlementMapper.getDashboardSummary(params);
    }

    // 대시보드 차트
    public List<SalesChartVO> getSalesChart(
            String startDate,
            String endDate,
            Integer customerId,
            Integer itemId) {
        Map<String, Object> params = new HashMap<>();
        params.put("startDate", startDate);
        params.put("endDate", endDate);
        params.put("customerId", customerId);
        params.put("itemId", itemId);

        return settlementMapper.getSalesChart(params);
    }

    // 거래처별 매출 TOP 5 조회
    public List<SalesChartVO> getCustomerTop5(String startDate, String endDate) {
        Map<String, Object> params = new HashMap<>();
        params.put("startDate", startDate);
        params.put("endDate", endDate);
        return settlementMapper.getCustomerTop5(params);
    }

    // 품목별 매출 TOP5 조회
    public List<SalesChartVO> getProductTop5(String startDate, String endDate) {
        Map<String, Object> params = new HashMap<>();
        params.put("startDate", startDate);
        params.put("endDate", endDate);
        return settlementMapper.getProductTop5(params);
    }
}
