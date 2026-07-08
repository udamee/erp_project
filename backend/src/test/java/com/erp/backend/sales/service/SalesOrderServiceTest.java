package com.erp.backend.sales.service;

import com.erp.backend.common.CustomException;
import com.erp.backend.common.ErrorCode;
import com.erp.backend.sales.dto.SalesOrderDetailRequestDTO;
import com.erp.backend.sales.dto.SalesOrderRequestDTO;
import com.erp.backend.sales.mapper.SalesOrderMapper;
import com.erp.backend.sales.util.OrderStatus;
import com.erp.backend.sales.vo.ProductVO;
import com.erp.backend.sales.vo.SalesOrderAmountCheckVO;
import com.erp.backend.sales.vo.SalesOrderDetailVO;
import com.erp.backend.sales.vo.SalesOrderVO;
import com.erp.backend.settlement.mapper.SettlementMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * SalesOrderService 핵심 비즈니스 로직 단위 테스트.
 * 매퍼는 모두 Mock 으로 대체하여 DB 없이 서비스 계층의 계산/검증 로직만 검증한다.
 * 검증 대상: 주문 금액 계산, 재고 부족 차단, 여신 한도(500만원) 차단, 주문 승인 상태 전이.
 */
@ExtendWith(MockitoExtension.class)
class SalesOrderServiceTest {

    @Mock
    private SalesOrderMapper salesOrderMapper;

    @Mock
    private SettlementMapper settlementMapper;

    @InjectMocks
    private SalesOrderService salesOrderService;

    private static final long EMP_ID = 7L;
    private static final int CUSTOMER_ID = 10;

    // ----- 테스트 헬퍼 -----

    private SalesOrderDetailRequestDTO detail(int productId, int qty) {
        SalesOrderDetailRequestDTO d = new SalesOrderDetailRequestDTO();
        d.setProductId(productId);
        d.setOrderQty(qty);
        return d;
    }

    private SalesOrderRequestDTO request(int customerId, SalesOrderDetailRequestDTO... details) {
        SalesOrderRequestDTO req = new SalesOrderRequestDTO();
        req.setCustomerId(customerId);
        req.setDetails(List.of(details));
        return req;
    }

    private ProductVO product(int productId, long unitPrice) {
        ProductVO p = new ProductVO();
        p.setProductId(productId);
        p.setStandardSalesPrice(BigDecimal.valueOf(unitPrice));
        return p;
    }

    private SalesOrderVO headerWithId(int soId) {
        SalesOrderVO vo = new SalesOrderVO();
        vo.setSoId(soId);
        return vo;
    }

    private SalesOrderAmountCheckVO matchedCheck() {
        SalesOrderAmountCheckVO vo = new SalesOrderAmountCheckVO();
        vo.setHeaderAmountMatched("Y");
        vo.setDetailAmountMatched("Y");
        return vo;
    }

    private CustomException catchCustomException(org.junit.jupiter.api.function.Executable executable) {
        try {
            executable.execute();
        } catch (CustomException e) {
            return e;
        } catch (Throwable t) {
            throw new AssertionError("CustomException 이 아닌 예외 발생: " + t, t);
        }
        throw new AssertionError("예외가 발생하지 않았습니다.");
    }

    @Nested
    @DisplayName("makeOrder - 주문 생성")
    class MakeOrder {

        @Test
        @DisplayName("정상 주문이면 상세 금액(단가×수량)과 합계가 정확히 계산된다")
        void calculatesAmounts() {
            // given: 1000원×2 = 2000, 1500원×3 = 4500 → 합계 6500
            SalesOrderRequestDTO req = request(CUSTOMER_ID, detail(1, 2), detail(2, 3));
            when(salesOrderMapper.currentSalesOrderSeq()).thenReturn(100);
            when(salesOrderMapper.findActiveProduct(1)).thenReturn(product(1, 1000));
            when(salesOrderMapper.findActiveProduct(2)).thenReturn(product(2, 1500));
            when(salesOrderMapper.findAvailableQtyByProductId(1)).thenReturn(100);
            when(salesOrderMapper.findAvailableQtyByProductId(2)).thenReturn(100);
            when(salesOrderMapper.currentSalesOrderDetailSeq()).thenReturn(1, 2);
            when(settlementMapper.findCurrentReceivableAmount(CUSTOMER_ID)).thenReturn(BigDecimal.ZERO);
            when(salesOrderMapper.makeSalesOrder(any())).thenReturn(1);
            when(salesOrderMapper.makeSalesOrderDetail(any())).thenReturn(1);
            when(salesOrderMapper.verifySalesOrderTotal(100)).thenReturn(matchedCheck());
            when(salesOrderMapper.findOrderHeaderById(100)).thenReturn(headerWithId(100));

            // when
            salesOrderService.makeOrder(req, EMP_ID);

            // then: 헤더 합계
            ArgumentCaptor<SalesOrderVO> headerCaptor = ArgumentCaptor.forClass(SalesOrderVO.class);
            verify(salesOrderMapper).makeSalesOrder(headerCaptor.capture());
            assertThat(headerCaptor.getValue().getTotalAmount()).isEqualByComparingTo("6500");
            assertThat(headerCaptor.getValue().getStatus()).isEqualTo(OrderStatus.REQUESTED.name());

            // then: 각 상세 라인 금액
            ArgumentCaptor<SalesOrderDetailVO> detailCaptor = ArgumentCaptor.forClass(SalesOrderDetailVO.class);
            verify(salesOrderMapper, times(2)).makeSalesOrderDetail(detailCaptor.capture());
            List<SalesOrderDetailVO> details = detailCaptor.getAllValues();
            assertThat(details.get(0).getAmount()).isEqualByComparingTo("2000");
            assertThat(details.get(1).getAmount()).isEqualByComparingTo("4500");
        }

        @Test
        @DisplayName("출고 가능 재고보다 주문 수량이 많으면 SALES_INSUFFICIENT_STOCK 으로 차단된다")
        void rejectsWhenStockInsufficient() {
            SalesOrderRequestDTO req = request(CUSTOMER_ID, detail(1, 10));
            when(salesOrderMapper.currentSalesOrderSeq()).thenReturn(100);
            when(salesOrderMapper.findActiveProduct(1)).thenReturn(product(1, 1000));
            when(salesOrderMapper.findAvailableQtyByProductId(1)).thenReturn(5); // 재고 5 < 주문 10

            CustomException ex = catchCustomException(() -> salesOrderService.makeOrder(req, EMP_ID));

            assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.SALES_INSUFFICIENT_STOCK);
            verify(salesOrderMapper, never()).makeSalesOrder(any()); // 주문이 저장되지 않아야 한다
        }

        @Test
        @DisplayName("미수금 + 주문액이 여신 한도(500만원)를 초과하면 SALES_CREDIT_LIMIT_EXCEED 로 차단된다")
        void rejectsWhenCreditLimitExceeded() {
            // 미수금 0 + 주문 600만원 → 한도 초과
            SalesOrderRequestDTO req = request(CUSTOMER_ID, detail(1, 2));
            when(salesOrderMapper.currentSalesOrderSeq()).thenReturn(100);
            when(salesOrderMapper.findActiveProduct(1)).thenReturn(product(1, 3_000_000));
            when(salesOrderMapper.findAvailableQtyByProductId(1)).thenReturn(100);
            when(salesOrderMapper.currentSalesOrderDetailSeq()).thenReturn(1);
            when(settlementMapper.findCurrentReceivableAmount(CUSTOMER_ID)).thenReturn(BigDecimal.ZERO);

            CustomException ex = catchCustomException(() -> salesOrderService.makeOrder(req, EMP_ID));

            assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.SALES_CREDIT_LIMIT_EXCEED);
            verify(salesOrderMapper, never()).makeSalesOrder(any());
        }

        @Test
        @DisplayName("미수금 + 주문액이 정확히 한도(500만원)와 같으면 통과한다 (경계값)")
        void passesWhenExactlyAtCreditLimit() {
            // 미수금 200만 + 주문 300만 = 500만 → 초과 아님(> 가 아니라 == 이므로 통과)
            SalesOrderRequestDTO req = request(CUSTOMER_ID, detail(1, 1));
            when(salesOrderMapper.currentSalesOrderSeq()).thenReturn(100);
            when(salesOrderMapper.findActiveProduct(1)).thenReturn(product(1, 3_000_000));
            when(salesOrderMapper.findAvailableQtyByProductId(1)).thenReturn(100);
            when(salesOrderMapper.currentSalesOrderDetailSeq()).thenReturn(1);
            when(settlementMapper.findCurrentReceivableAmount(CUSTOMER_ID))
                    .thenReturn(BigDecimal.valueOf(2_000_000));
            when(salesOrderMapper.makeSalesOrder(any())).thenReturn(1);
            when(salesOrderMapper.makeSalesOrderDetail(any())).thenReturn(1);
            when(salesOrderMapper.verifySalesOrderTotal(100)).thenReturn(matchedCheck());
            when(salesOrderMapper.findOrderHeaderById(100)).thenReturn(headerWithId(100));

            salesOrderService.makeOrder(req, EMP_ID);

            verify(salesOrderMapper).makeSalesOrder(any()); // 정상 저장됨
        }

        @Test
        @DisplayName("요청이 null 이면 SALES_ORDER_REQUEST_INVALID 로 차단된다")
        void rejectsNullRequest() {
            CustomException ex = catchCustomException(() -> salesOrderService.makeOrder(null, EMP_ID));
            assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.SALES_ORDER_REQUEST_INVALID);
        }

        @Test
        @DisplayName("주문 수량이 0 이하이면 SALES_ORDER_FAILED 로 차단된다")
        void rejectsNonPositiveQty() {
            SalesOrderRequestDTO req = request(CUSTOMER_ID, detail(1, 0));
            when(salesOrderMapper.currentSalesOrderSeq()).thenReturn(100);

            CustomException ex = catchCustomException(() -> salesOrderService.makeOrder(req, EMP_ID));

            assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.SALES_ORDER_FAILED);
        }
    }

    @Nested
    @DisplayName("approveRequest - 주문 승인")
    class ApproveRequest {

        @Test
        @DisplayName("요청(REQUESTED) 상태이고 금액이 일치하면 승인되어 상태가 APPROVED 로 바뀐다")
        void approvesRequestedOrder() {
            SalesOrderVO input = new SalesOrderVO();
            input.setSoId(55);

            SalesOrderVO stored = new SalesOrderVO();
            stored.setSoId(55);
            stored.setStatus(OrderStatus.REQUESTED.name());

            when(salesOrderMapper.findOrderHeaderById(55)).thenReturn(stored);
            when(salesOrderMapper.existsRequestedOrderWithDetail(55)).thenReturn(1);
            when(salesOrderMapper.verifySalesOrderTotal(55)).thenReturn(matchedCheck());
            when(salesOrderMapper.approveRequest(any())).thenReturn(1);

            salesOrderService.approveRequest(input);

            ArgumentCaptor<SalesOrderVO> captor = ArgumentCaptor.forClass(SalesOrderVO.class);
            verify(salesOrderMapper).approveRequest(captor.capture());
            assertThat(captor.getValue().getStatus()).isEqualTo(OrderStatus.APPROVED.name());
            assertThat(captor.getValue().getApproveDate()).isNotNull();
        }

        @Test
        @DisplayName("이미 승인된 주문이면 SALES_ALREADY_APPROVED 로 중복 승인이 차단된다")
        void rejectsAlreadyApproved() {
            SalesOrderVO input = new SalesOrderVO();
            input.setSoId(55);

            SalesOrderVO approved = new SalesOrderVO();
            approved.setSoId(55);
            approved.setStatus(OrderStatus.APPROVED.name());
            when(salesOrderMapper.findOrderHeaderById(55)).thenReturn(approved);

            CustomException ex = catchCustomException(() -> salesOrderService.approveRequest(input));

            assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.SALES_ALREADY_APPROVED);
            verify(salesOrderMapper, never()).approveRequest(any());
        }

        @Test
        @DisplayName("soId 가 없는 요청이면 SALES_APPROVE_FAILED 로 차단된다")
        void rejectsMissingId() {
            CustomException ex = catchCustomException(() -> salesOrderService.approveRequest(new SalesOrderVO()));
            assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.SALES_APPROVE_FAILED);
        }
    }
}
