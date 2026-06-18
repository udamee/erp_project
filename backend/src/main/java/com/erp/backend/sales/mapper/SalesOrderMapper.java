package com.erp.backend.sales.mapper;
import com.erp.backend.sales.vo.*;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;

@Mapper
public interface SalesOrderMapper {
    //주문 요청상태 검증과 상세 존재여부 확인
    int existsRequestedOrderWithDetail(int salesOrderId);
    //상태 조건에 따른 주문 목록 조회
    List<SalesOrderVO> findAllSalesOrders(String status);
    //상품에 따른 전체 로트 정보 조회
    List<ProductVO> findProductLotsById(int productId);
    //상품 활성상태 여부 검사
    ProductVO findActiveProduct(int productId);
    //상품 출고 가능 총 수 조회
    int findAvailableQtyByProductId(int productId);
    //출고 가능한 로트 목록 조회
    List<ProductVO> findAvailableProductLotsByProductId(int productId);
    //주문의 요청 상태 주문 조회
    List<SalesOrderVO> findRequestOrderById(int salesOrderId);
    //주문 상태 목록 조회
    List<SalesOrderVO> findAllOrderStatus();
    //주문 조회
    SalesOrderVO findOrderHeaderById(int soId);
    //주문 상세 목록 조회
    List<SalesOrderDetailVO> findOrderDetailListByOrderId(int soId);
    //주문 정보 조회
    SalesOrderVO findSalesOrder(int soId);
    //주문 생성
    int makeSalesOrder(SalesOrderVO salesOrderVO);
    //주문 상세 생성
    int makeSalesOrderDetail(SalesOrderDetailVO salesOrderDetailVO);
    //주문 시퀸스 값 조회
    int currentSalesOrderSeq();
    //주문 상세 시퀸스 값 조회
    int currentSalesOrderDetailSeq();
    //요청 상태 주문 승인
    int approveRequest(SalesOrderVO salesOrderVO);
    //주문과 상세 금액의 일치여부 확인
    SalesOrderAmountCheckVO verifySalesOrderTotal(int salesOrderId);
    //FEFO 기준 출고가능 로트 목록 조회
    List<ItemLotVO> findAvailableLotByProductId(int productId);
}
