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
    public List<ProductVO> findProductLotsByProductId(int productId){
        return salesOrderMapper.findProductLotsById(productId);
    }
    public List<ProductVO> findAvailableProducts(int productId){
        return salesOrderMapper.findAvailableProductLotsByProductId(productId);
    }
    public List<SalesOrderVO> findRequestOrder(int salesOrderId){
        return salesOrderMapper.findRequestOrderById(salesOrderId);
    }
    public List<SalesOrderVO> findAllOrderStatusList(){
        return salesOrderMapper.findAllOrderStatus();
    }
    public SalesOrderVO findSalesOrderById(int soId){
        return salesOrderMapper.findOrderHeaderById(soId);
    }
    public SalesOrderVO findSalesOrderWithDetails(int soId){
        SalesOrderVO order = salesOrderMapper.findOrderHeaderById(soId);
        if (order == null) {
            return null;
        }
        List<SalesOrderDetailVO> details = salesOrderMapper.findOrderDetailListByOrderId(order.getSoId());
        order.setDetailList(details);
        return order;
    }

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
        //실패시 로직 추가 필요
        return orderId;
    }

    @Transactional
    public SalesOrderVO approveRequest(SalesOrderVO salesOrderVO){
        SalesOrderAmountCheckVO salesOrderAmountCheckVO;
        salesOrderAmountCheckVO=verifyAmount(salesOrderVO.getSoId());
        if(!salesOrderAmountCheckVO.amountMatched()){
            throw new CustomException(ErrorCode.SALES_NOT_AMOUNT_MATCHED);
        }
        salesOrderVO.setStatus(OrderStatus.APPROVED.name());
        salesOrderVO.setApproveDate(LocalDateTime.now());
        if(salesOrderMapper.approveRequest(salesOrderVO)!=1){
            throw new CustomException(ErrorCode.SALES_APPROVE_FAILED);
        }
        return salesOrderMapper.findOrderHeaderById(salesOrderVO.getSoId());
    }

    public SalesOrderAmountCheckVO verifyAmount(int salesId){
        return salesOrderMapper.verifySalesOrderTotal(salesId);
    }

    public void existsRequestedOrderDetail(int salesOrderId){
        System.out.println(salesOrderMapper.existsRequestedOrderWithDetail(salesOrderId));
    }

}

//재고차감
//INVENTORYLOT
//1.인벤토리에서 해당 로트를 조회해서 차감(현재고,수정날짜수정)
//2.현재고가 0 이하로 떨어질시(상태수정)
//STOCKMOVEMENT
//1.변동이력생성(변동재고,변동전재고,변동후재고,변동사유,변동사유연관일렬번호,작업처리자,변동데이터생성일,변동데이터수정일)
//SHIPMENT
//1.출고헤더생성
//SHIPMENTDETAIL
//1.출고상세데이터생성


//출고
//SHIPMENT
//SHIPMENTDETAIL

//→ 재고 차감
//→ 출고상세 생성
//→ 주문 상태를 APPROVED 또는 SHIPPED 계열로 변경

//주문승인/출고
//→ 주문 상태가 REQUESTED인지 확인
//→ 현재 로트 재고를 FOR UPDATE로 조회
//→ FEFO로 배정 가능 여부 최종 확인
//→ 부족하면 승인 실패
//→ 충분하면 로트별 차감 계획 생성
//→ 재고 차감
//→ 출고상세/주문상태 반영
