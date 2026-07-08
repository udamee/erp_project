package com.erp.backend.customer.service;

import com.erp.backend.common.CustomException;
import com.erp.backend.common.ErrorCode;
import com.erp.backend.customer.dto.CustomerCreateRequestDto;
import com.erp.backend.customer.dto.CustomerResponseDto;
import com.erp.backend.customer.dto.CustomerUpdateRequestDto;
import com.erp.backend.customer.mapper.CustomerMapper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerMapper customerMapper;
    private final BusinessVerifyService businessVerifyService;

    // ---------- 거래처 등록 ----------
    @Transactional
    public void createCustomer(CustomerCreateRequestDto dto) {

        // 사업자번호 필수 검증
        if (dto.getBusinessNo() == null || dto.getBusinessNo().isBlank()) {
            throw new CustomException(ErrorCode.BUSINESS_NO_REQUIRED);
        }

        // 사업자번호를 입력한 경우에만 검증 (선택 입력)
        if (dto.getBusinessNo() != null && !dto.getBusinessNo().isBlank()) {

            // 중복 확인
            int count = customerMapper.countByBusinessNo(dto.getBusinessNo());
            if (count > 0) {
                throw new CustomException(ErrorCode.DUPLICATE_BUSINESS_NO);
            }

            // 국세청 상태조회 - 정상 영업(계속사업자)만 등록 허용
            Map<String, Object> status = businessVerifyService.checkStatus(dto.getBusinessNo());
            boolean registered = Boolean.TRUE.equals(status.get("registered"));
            boolean valid = Boolean.TRUE.equals(status.get("valid"));

            if (!registered) {
                throw new CustomException(ErrorCode.BUSINESS_NOT_REGISTERED);
            }
            if (!valid) {
                // 휴업·폐업 등
                throw new CustomException(ErrorCode.BUSINESS_NOT_ACTIVE);
            }
        }

        Map<String, Object> params = new HashMap<>();
        params.put("customerName", dto.getCustomerName());
        params.put("customerType", dto.getCustomerType());
        params.put("businessNo", dto.getBusinessNo());
        params.put("creditLimit", dto.getCreditLimit() != null ? dto.getCreditLimit() : BigDecimal.ZERO);
        params.put("phone", dto.getPhone());
        params.put("address", dto.getAddress());

        customerMapper.insertCustomer(params);
    }

    // ---------- 거래처 목록 조회 ----------
    public List<CustomerResponseDto> getCustomers(String customerType, String status, String keyword) {
        Map<String, Object> params = new HashMap<>();
        params.put("customerType", customerType);
        params.put("status", status);
        params.put("keyword", keyword);
        return customerMapper.findAllCustomers(params);
    }

    // ---------- 거래처 상세 조회 ----------
    public CustomerResponseDto getCustomerById(Long customerId) {
        CustomerResponseDto customer = customerMapper.findCustomerById(customerId);
        if (customer == null) {
            throw new CustomException(ErrorCode.CUSTOMER_NOT_FOUND);
        }
        return customer;
    }

    // ---------- 거래처 수정 ----------
    @Transactional
    public void updateCustomer(Long customerId, @Valid CustomerUpdateRequestDto dto) {
        // 존재 여부 확인
        CustomerResponseDto existing = customerMapper.findCustomerById(customerId);
        if (existing == null) {
            throw new CustomException(ErrorCode.CUSTOMER_NOT_FOUND);
        }

        Map<String, Object> params = new HashMap<>();
        params.put("customerId", customerId);
        params.put("customerName", dto.getCustomerName());
        params.put("customerType", dto.getCustomerType());
        params.put("businessNo", dto.getBusinessNo());
        params.put("creditLimit", dto.getCreditLimit() != null ? dto.getCreditLimit() : BigDecimal.ZERO);
        params.put("phone", dto.getPhone());
        params.put("address", dto.getAddress());
        params.put("status", "ACTIVE");

        customerMapper.updateCustomer(params);
    }
}