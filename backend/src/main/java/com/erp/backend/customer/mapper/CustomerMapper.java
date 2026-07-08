package com.erp.backend.customer.mapper;

import com.erp.backend.customer.dto.CustomerResponseDto;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;
import java.util.Map;

@Mapper
public interface CustomerMapper {

    // 거래처 등록
    void insertCustomer(Map<String, Object> params);

    // 방금 등록된 CUSTOMER_ID 조회
    Long getCurrentCustomerId();

    // 거래처 목록 조회 (상태·유형 필터)
    List<CustomerResponseDto> findAllCustomers(Map<String, Object> params);

    // 거래처 상세 조회
    CustomerResponseDto findCustomerById(Long customerId);

    // 거래처 수정
    void updateCustomer(Map<String, Object> params);

    // 사업자번호 중복 확인
    int countByBusinessNo(String businessNo);
}