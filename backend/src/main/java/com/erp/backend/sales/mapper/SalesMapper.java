package com.erp.backend.sales.mapper;

import com.erp.backend.sales.vo.*;
import org.apache.ibatis.annotations.Mapper;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Mapper
public interface SalesMapper {
    // 목록 조회
    // 매출청구 (Sales Invoice)
    List<SalesInvoiceVO> findAllSalesInvoices(Map<String, Object> params);

    // 매출채권 (Account Receivable)
    List<AccountReceivableVO> findAllAccountReceivables(Map<String, Object> params);

    // 입금관리 (Payment)
    List<PaymentVO> findAllPayments(Map<String, Object> params);

    // 매입청구 (Purchase Invoice)
    List<PurchaseInvoiceVO> findAllPurchaseInvoices(Map<String, Object> params);

    // 매입채무 (Account Payable)
    List<AccountPayableVO> findAllAccountPayables(Map<String, Object> params);

    // 손익정산 (Settlement)
    List<SettlementVO> findAllSettlements(Map<String, Object> params);

    // 상세조회
    // 매출청구 상세조회
    SalesInvoiceVO findSalesInvoiceById(Long salesInvoiceId);

    // 매출청구 상세조회
    PurchaseInvoiceVO findPurchaseInvoiceById(Long purchaseInvoiceId);

    // 미수금 상세조회
    AccountReceivableVO findAccountReceivableById(Long arId);

    // 미지급금 상세조회
    AccountPayableVO findAccountPayableById(Long apId);

    // 수금내역 상세조회
    PaymentVO findPaymentById(Long paymentId);

    // 손익정산 상세조회
    SettlementVO findSettlementById(Long settlementId);

    // 매출청구 등록
    int insertSalesInvoice(SalesInvoiceVO salesInvoiceVO);

    // 매출채권(미수금) 등록
    int insertAccountReceivable(AccountReceivableVO accountReceivableVO);

    // 수금 처리
    int insertPayment(PaymentVO paymentVO);

    // 미수금 입금액/잔액 수정
    int updateAccountReceivablePayment(PaymentVO paymentVO);

    // 여신한도 체크용 현재 미수금 조회
    BigDecimal findCurrentReceivableAmount(Integer customerId);

    // 기간별 총매출 조회
    BigDecimal findTotalSalesAmount(Map<String, Object> params);

    // 기간별 총매입 조회
    BigDecimal findTotalPurchaseAmount(Map<String, Object> params);

    // 기간별 총미수금 조회
    BigDecimal findTotalReceivableAmount(Map<String, Object> params);

    // 기간별 총미지급금 조회
    BigDecimal findTotalPayableAmount(Map<String, Object> params);

    // 손익정산 등록
    int insertSettlement(SettlementVO settlementVO);

    // 대시보드 조회
    DashboardVO getDashboardSummary(Map<String, Object> params);

    // 미수금 잔액 조회
    BigDecimal findRemainAmountByArId(Integer arId);

    // 대시보드 차트
    List<SalesChartVO> getSalesChart(Map<String, Object> params);

    // 거래처별 매출 TOP5
    List<SalesChartVO> getCustomerTop5(Map<String, Object> params);

    // 품목별 매출 TOP5
    List<SalesChartVO> getProductTop5(Map<String, Object> params);
}