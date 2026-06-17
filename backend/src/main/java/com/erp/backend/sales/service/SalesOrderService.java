package com.erp.backend.sales.service;

import com.erp.backend.common.CustomException;
import com.erp.backend.common.ErrorCode;
import com.erp.backend.sales.dto.SalesOrderListResponseDTO;
import com.erp.backend.sales.util.OrderStatus;
import com.erp.backend.sales.dto.SalesOrderRequestDTO;
import com.erp.backend.sales.mapper.SalesOrderMapper;
import com.erp.backend.sales.vo.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;


@Service
@RequiredArgsConstructor
public class SalesOrderService {

    private final SalesOrderMapper salesOrderMapper;

    //주문상태에 따른 전체주문조회
    public List<SalesOrderListResponseDTO> findAllSalesOrders(String status){
        List<SalesOrderVO> salesOrderList = salesOrderMapper.findAllSalesOrders(status);
        List<SalesOrderListResponseDTO> list = new ArrayList<>();
        for(SalesOrderVO salesOrderVO:salesOrderList) {
            SalesOrderListResponseDTO salesOrderListResponseDTO = new SalesOrderListResponseDTO();
            salesOrderListResponseDTO.setSo_id(salesOrderVO.getSoId());
            salesOrderListResponseDTO.setCustomer_name(salesOrderVO.getCustomerName());
            salesOrderListResponseDTO.setReq_employee_name(salesOrderVO.getReqEmployeeName());
            salesOrderListResponseDTO.setApp_employee_name(salesOrderVO.getAppEmployeeName());
            salesOrderListResponseDTO.setOrder_date(salesOrderVO.getOrderDate());
            salesOrderListResponseDTO.setStatus(salesOrderVO.getStatus());
            salesOrderListResponseDTO.setApprove_date(salesOrderVO.getApproveDate());
            salesOrderListResponseDTO.setTotal_amount(salesOrderVO.getTotalAmount());
            salesOrderListResponseDTO.setMemo(salesOrderVO.getMemo());
            salesOrderListResponseDTO.setCreated_at(salesOrderVO.getCreatedAt());
            salesOrderListResponseDTO.setUpdated_at(salesOrderVO.getUpdatedAt());
            list.add(salesOrderListResponseDTO);
        }
        return list;
    }
    //특정상품의 전체로트 조회
    public List<ProductVO> findProductLotsByProductId(int productId){
        return salesOrderMapper.findProductLotsById(productId);
    }
    //특정상품의 출고조건 만족 로트조회
    public List<ProductVO> findAvailableProducts(int productId){
        return salesOrderMapper.findAvailableProductLotsByProductId(productId);
    }
    //주문요청에 따른 상태조회
    public List<SalesOrderVO> findRequestOrder(int salesOrderId){
        return salesOrderMapper.findRequestOrderById(salesOrderId);
    }
    //주문상태 목록 조회
    public List<SalesOrderVO> findAllOrderStatusList(){
        return salesOrderMapper.findAllOrderStatus();
    }
    //1건 주문 조회
    public SalesOrderVO findSalesOrderById(int soId){
        return salesOrderMapper.findOrderHeaderById(soId);
    }
    //1건 주문상세목록 조회
    public SalesOrderVO findSalesOrderWithDetails(int soId){
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
    public Integer makeOrder(SalesOrderRequestDTO requestDTO){
        int orderId = salesOrderMapper.currentSalesOrderSeq();
        SalesOrderVO salesOrderVO = new SalesOrderVO();
        salesOrderVO.setSoId(orderId);
        salesOrderVO.setCustomerId(requestDTO.getCustomerId());
        salesOrderVO.setReqEmployeeId(requestDTO.getEmployeeId());
        ProductVO productVO = salesOrderMapper.findActiveProduct(requestDTO.getProductId());
        if(productVO==null){
            throw new CustomException(ErrorCode.NOT_FOUND);
        }
        salesOrderVO.setTotalAmount(requestDTO.getAmount());
        salesOrderVO.setOrderDate(LocalDateTime.now());
        salesOrderVO.setStatus(OrderStatus.REQUESTED.name());

        if(requestDTO.getOrderQty() > salesOrderMapper.findAvailableQtyByProductId(productVO.getProductId())){
            throw new CustomException(ErrorCode.SALES_NOT_AVAILABLE_STOCK);
        }
        int result = salesOrderMapper.makeSalesOrder(salesOrderVO);
        if (result != 1){
            throw new CustomException(ErrorCode.SALES_ORDER_FAILED);
        }
        int detailId = salesOrderMapper.currentSalesOrderDetailSeq();
        SalesOrderDetailVO salesOrderDetailVO = new SalesOrderDetailVO();
        salesOrderDetailVO.setSoDetailId(detailId);
        salesOrderDetailVO.setSoId(orderId);
        salesOrderDetailVO.setProductId(requestDTO.getProductId());
        salesOrderDetailVO.setOrderQty(requestDTO.getOrderQty());
        salesOrderDetailVO.setUnitPrice(productVO.getStandardSalesPrice());
        salesOrderDetailVO.setAmount(productVO.getStandardSalesPrice().multiply(BigDecimal.valueOf(requestDTO.getOrderQty())));
        int detailResult =salesOrderMapper.makeSalesOrderDetail(salesOrderDetailVO);
        if (detailResult != 1){
            throw new CustomException(ErrorCode.SALES_ORDER_FAILED);
        }
        return orderId;
    }

    //승인요청
    @Transactional
    public SalesOrderVO approveRequest(SalesOrderVO salesOrderVO){
        int exists = existsRequestedOrderDetail(salesOrderVO.getSoId());
        if(exists != 1){
            throw new CustomException(ErrorCode.SALES_APPROVE_FAILED);
        }
        SalesOrderAmountCheckVO salesOrderAmountCheckVO;
        salesOrderAmountCheckVO=verifyAmount(salesOrderVO.getSoId());
        if(salesOrderAmountCheckVO == null || !salesOrderAmountCheckVO.amountMatched()){
            throw new CustomException(ErrorCode.SALES_NOT_AMOUNT_MATCHED);
        }
        salesOrderVO.setStatus(OrderStatus.APPROVED.name());
        salesOrderVO.setApproveDate(LocalDateTime.now());
        if(salesOrderMapper.approveRequest(salesOrderVO)!=1){
            throw new CustomException(ErrorCode.SALES_APPROVE_FAILED);
        }
        return salesOrderMapper.findOrderHeaderById(salesOrderVO.getSoId());
    }

    //주문서 금액 검사
    public SalesOrderAmountCheckVO verifyAmount(int salesId){
        return salesOrderMapper.verifySalesOrderTotal(salesId);
    }

    //상세주문 존재여부 확인
    public int existsRequestedOrderDetail(int salesOrderId){
        return salesOrderMapper.existsRequestedOrderWithDetail(salesOrderId);
    }

}
