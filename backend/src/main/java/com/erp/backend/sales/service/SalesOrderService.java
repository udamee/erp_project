package com.erp.backend.sales.service;

import com.erp.backend.common.CustomException;
import com.erp.backend.common.ErrorCode;
import com.erp.backend.common.PageResponse;
import com.erp.backend.sales.dto.SalesOrderDetailRequestDTO;
import com.erp.backend.sales.dto.SalesOrderListResponseDTO;
import com.erp.backend.sales.dto.SalesOrderStatusCountDTO;
import com.erp.backend.sales.util.OrderStatus;
import com.erp.backend.sales.dto.SalesOrderRequestDTO;
import com.erp.backend.sales.mapper.SalesOrderMapper;
import com.erp.backend.sales.vo.*;
import com.erp.backend.settlement.mapper.SettlementMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


@Service
@RequiredArgsConstructor
public class SalesOrderService {

    private final SalesOrderMapper salesOrderMapper;
    private final SettlementMapper settlementMapper;

    //주문상태에 따른 전체주문조회
    public List<SalesOrderListResponseDTO> findAllSalesOrders(String status, int offset, int size) {
        List<SalesOrderVO> salesOrderList = salesOrderMapper.findAllSalesOrders(status, offset, size);
        List<SalesOrderListResponseDTO> list = new ArrayList<>();
        for (SalesOrderVO salesOrderVO : salesOrderList) {
            SalesOrderListResponseDTO salesOrderListResponseDTO = new SalesOrderListResponseDTO();
            salesOrderListResponseDTO.setSoId(salesOrderVO.getSoId());
            salesOrderListResponseDTO.setCustomerName(salesOrderVO.getCustomerName());
            salesOrderListResponseDTO.setReqEmployeeName(salesOrderVO.getReqEmployeeName());
            salesOrderListResponseDTO.setAppEmployeeName(salesOrderVO.getAppEmployeeName());
            salesOrderListResponseDTO.setOrderDate(salesOrderVO.getOrderDate());
            salesOrderListResponseDTO.setStatus(salesOrderVO.getStatus());
            salesOrderListResponseDTO.setApproveDate(salesOrderVO.getApproveDate());
            salesOrderListResponseDTO.setTotalAmount(salesOrderVO.getTotalAmount());
            salesOrderListResponseDTO.setMemo(salesOrderVO.getMemo());
            salesOrderListResponseDTO.setCreatedAt(salesOrderVO.getCreatedAt());
            salesOrderListResponseDTO.setUpdatedAt(salesOrderVO.getUpdatedAt());
            list.add(salesOrderListResponseDTO);
        }
        return list;
    }

    public PageResponse<SalesOrderListResponseDTO> findAllSalesOrdersPaging(String status, int page, int size) {
        int safePage = Math.max(page, 1);
        int safeSize = Math.max(size, 1);

        int offset = (safePage - 1) * safeSize;
        List<SalesOrderListResponseDTO> list = findAllSalesOrders(status, offset, safeSize);
        int total = salesOrderMapper.findCountsForSalesOrders(status);
        return new PageResponse<>(list, safePage, safeSize, total);
    }

    public Integer findCountsForSalesOrders(String status) {
        return salesOrderMapper.findCountsForSalesOrders(status);
    }

    public Map<String, Integer> findCountsByStatus() {
        List<SalesOrderStatusCountDTO> counts = salesOrderMapper.findCountsByStatus();
        Map<String, Integer> result = new HashMap<>();
        for (SalesOrderStatusCountDTO count : counts) {
            result.put(count.getStatus(), count.getCount());
        }
        return result;
    }

    //특정상품의 전체로트 조회
    public List<ProductVO> findProductLotsByProductId(int productId) {
        return salesOrderMapper.findProductLotsById(productId);
    }

    //특정상품의 출고조건 만족 로트조회
    public List<ProductVO> findAvailableProducts(int productId) {
        return salesOrderMapper.findAvailableProductLotsByProductId(productId);
    }

    //주문요청에 따른 상태조회
    public List<SalesOrderVO> findRequestOrder(int salesOrderId) {
        return salesOrderMapper.findRequestOrderById(salesOrderId);
    }

    //주문상태 목록 조회
    public List<SalesOrderVO> findAllOrderStatusList() {
        return salesOrderMapper.findAllOrderStatus();
    }

    //1건 주문 조회
    public SalesOrderVO findSalesOrderById(int soId) {
        return salesOrderMapper.findOrderHeaderById(soId);
    }

    //1건 주문상세목록 조회
    public SalesOrderVO findSalesOrderWithDetails(int soId) {
        SalesOrderVO order = salesOrderMapper.findOrderHeaderById(soId);
        if (order == null) {
            return null;
        }
        List<SalesOrderDetailVO> details = salesOrderMapper.findOrderDetailListByOrderId(order.getSoId());
        order.setDetailList(details);
        return order;
    }

    //주문생성
    @Transactional
    public SalesOrderVO makeOrder(SalesOrderRequestDTO requestDTO, long empId) {
        if (requestDTO == null) {
            throw new CustomException(ErrorCode.SALES_ORDER_REQUEST_INVALID);
        }
        if (requestDTO.getCustomerId() <= 0 || requestDTO.getDetails() == null || requestDTO.getDetails().isEmpty()) {
            throw new CustomException(ErrorCode.SALES_ORDER_REQUEST_INVALID);
        }

        int orderId = salesOrderMapper.currentSalesOrderSeq();
        SalesOrderVO salesOrderVO = new SalesOrderVO();
        salesOrderVO.setSoId(orderId);
        salesOrderVO.setCustomerId(requestDTO.getCustomerId());
        salesOrderVO.setReqEmployeeId(empId);
        salesOrderVO.setMemo(requestDTO.getMemo());
        salesOrderVO.setOrderDate(LocalDateTime.now());
        salesOrderVO.setStatus(OrderStatus.REQUESTED.name());
        salesOrderVO.setCreatedAt(LocalDateTime.now());
        BigDecimal totalAmount = BigDecimal.ZERO;
        List<SalesOrderDetailVO> detailList = new ArrayList<>();
        for (SalesOrderDetailRequestDTO detailRequest : requestDTO.getDetails()) {
            if (detailRequest.getProductId() == null || detailRequest.getOrderQty() == null) {
                throw new CustomException(ErrorCode.SALES_ORDER_FAILED);
            }
            if (detailRequest.getOrderQty() <= 0) {
                throw new CustomException(ErrorCode.SALES_ORDER_FAILED);
            }
            ProductVO productVO = salesOrderMapper.findActiveProduct(detailRequest.getProductId());
            if (productVO == null) {
                throw new CustomException(ErrorCode.NOT_FOUND);
            }
            int availableQty = salesOrderMapper.findAvailableQtyByProductId(detailRequest.getProductId());
            if (availableQty < detailRequest.getOrderQty()) {
                throw new CustomException(ErrorCode.SALES_INSUFFICIENT_STOCK);
            }

            BigDecimal unitPrice = productVO.getStandardSalesPrice();
            if (unitPrice == null) {
                throw new CustomException(ErrorCode.SALES_ORDER_FAILED);
            }
            BigDecimal detailAmount = unitPrice.multiply(BigDecimal.valueOf(detailRequest.getOrderQty()));
            int detailId = salesOrderMapper.currentSalesOrderDetailSeq();
            SalesOrderDetailVO salesOrderDetailVO = new SalesOrderDetailVO();
            salesOrderDetailVO.setSoDetailId(detailId);
            salesOrderDetailVO.setSoId(orderId);
            salesOrderDetailVO.setProductId(detailRequest.getProductId());
            salesOrderDetailVO.setOrderQty(detailRequest.getOrderQty());
            salesOrderDetailVO.setUnitPrice(unitPrice);
            salesOrderDetailVO.setAmount(detailAmount);
            detailList.add(salesOrderDetailVO);
            totalAmount = totalAmount.add(detailAmount);
        }
        salesOrderVO.setTotalAmount(totalAmount);
        validateCustomerRemainBalance(requestDTO.getCustomerId(), totalAmount);
        int result = salesOrderMapper.makeSalesOrder(salesOrderVO);
        if (result != 1) {
            throw new CustomException(ErrorCode.SALES_ORDER_FAILED);
        }
        for (SalesOrderDetailVO salesOrderDetailVO : detailList) {
            int detailResult = salesOrderMapper.makeSalesOrderDetail(salesOrderDetailVO);
            if (detailResult != 1) {
                throw new CustomException(ErrorCode.SALES_ORDER_FAILED);
            }
        }
        SalesOrderAmountCheckVO amountCheckVO = salesOrderMapper.verifySalesOrderTotal(orderId);
        if (amountCheckVO == null || !"Y".equals(amountCheckVO.getHeaderAmountMatched()) || !"Y".equals(amountCheckVO.getDetailAmountMatched())) {
            throw new CustomException(ErrorCode.SALES_ORDER_FAILED);
        }
        return findSalesOrderWithDetails(orderId);
    }

    //승인요청
    @Transactional
    public SalesOrderVO approveRequest(SalesOrderVO salesOrderVO) {
        if (salesOrderVO == null || salesOrderVO.getSoId() == null) {
            throw new CustomException(ErrorCode.SALES_APPROVE_FAILED);
        }

        SalesOrderVO order = salesOrderMapper.findOrderHeaderById(salesOrderVO.getSoId());
        if (order == null) {
            throw new CustomException(ErrorCode.NOT_FOUND);
        }
        if (OrderStatus.APPROVED.name().equals(order.getStatus())) {
            throw new CustomException(ErrorCode.SALES_ALREADY_APPROVED);
        }
        if (OrderStatus.SHIPPED.name().equals(order.getStatus())) {
            throw new CustomException(ErrorCode.SALES_APPROVE_FAILED);
        }
        if (!OrderStatus.REQUESTED.name().equals(order.getStatus())) {
            throw new CustomException(ErrorCode.SALES_ORDER_FAILED);
        }

        int exists = countRequestedOrderDetail(salesOrderVO.getSoId());
        if (exists < 1) {
            throw new CustomException(ErrorCode.SALES_APPROVE_FAILED);
        }

        SalesOrderAmountCheckVO salesOrderAmountCheckVO;
        salesOrderAmountCheckVO = verifyAmount(salesOrderVO.getSoId());

        if (salesOrderAmountCheckVO == null || !salesOrderAmountCheckVO.amountMatched()) {
            throw new CustomException(ErrorCode.SALES_NOT_AMOUNT_MATCHED);
        }
        salesOrderVO.setStatus(OrderStatus.APPROVED.name());
        salesOrderVO.setApproveDate(LocalDateTime.now());

        if (salesOrderMapper.approveRequest(salesOrderVO) != 1) {
            throw new CustomException(ErrorCode.SALES_APPROVE_FAILED);
        }
        return salesOrderMapper.findOrderHeaderById(salesOrderVO.getSoId());
    }

    //주문서 금액 검사
    public SalesOrderAmountCheckVO verifyAmount(int salesId) {
        return salesOrderMapper.verifySalesOrderTotal(salesId);
    }

    //상세주문 존재여부 확인
    public int countRequestedOrderDetail(int salesOrderId) {
        return salesOrderMapper.existsRequestedOrderWithDetail(salesOrderId);
    }

    public List<ProductVO> findAllAvailableActiveProducts() {
        return salesOrderMapper.findAllActiveProducts();
    }

    public List<SalesOrderVO> findAllCustomers() {
        return salesOrderMapper.findAllCustomers();
    }

    private void validateCustomerRemainBalance(int customerId, BigDecimal orderAmount) {
        BigDecimal currentReceivableAmount = settlementMapper.findCurrentReceivableAmount(customerId);
        if (currentReceivableAmount == null) {
            currentReceivableAmount = BigDecimal.ZERO;
        }
        final BigDecimal CREDIT_LIMIT = BigDecimal.valueOf(5_000_000);
        BigDecimal expectedReceivable = currentReceivableAmount.add(orderAmount);
        if (expectedReceivable.compareTo(CREDIT_LIMIT) > 0) {
            throw new CustomException(ErrorCode.SALES_CREDIT_LIMIT_EXCEED);
        }
    }


}
