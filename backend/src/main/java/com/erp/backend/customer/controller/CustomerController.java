package com.erp.backend.customer.controller;

import com.erp.backend.common.ApiResponse;
import com.erp.backend.customer.dto.*;
import com.erp.backend.customer.service.BusinessVerifyService;
import com.erp.backend.customer.service.CustomerService;
import com.erp.backend.customer.service.MedicalInstSearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "거래처 관리", description = "거래처(약국·병원) 등록·수정·조회 + 약국·병원 검색 + 사업자번호 상태조회 API")
@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;
    private final BusinessVerifyService businessVerifyService;
    private final MedicalInstSearchService medicalInstSearchService;

    // ---------- 거래처 CRUD ----------

    @Operation(summary = "거래처 목록 조회")
    @GetMapping
    public ResponseEntity<ApiResponse<List<CustomerResponseDto>>> getCustomers(
            @RequestParam(required = false) String customerType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(
                ApiResponse.success(customerService.getCustomers(customerType, status, keyword)));
    }

    @Operation(summary = "거래처 상세 조회")
    @GetMapping("/{customerId}")
    public ResponseEntity<ApiResponse<CustomerResponseDto>> getCustomer(
            @PathVariable Long customerId) {
        return ResponseEntity.ok(
                ApiResponse.success(customerService.getCustomerById(customerId)));
    }

    @Operation(summary = "거래처 등록")
    @PostMapping
    public ResponseEntity<ApiResponse<Void>> createCustomer(
            @Valid @RequestBody CustomerCreateRequestDto requestDto) {
        customerService.createCustomer(requestDto);
        return ResponseEntity.ok(ApiResponse.success("거래처가 등록되었습니다.", null));
    }

    @Operation(summary = "거래처 수정")
    @PutMapping("/{customerId}")
    public ResponseEntity<ApiResponse<Void>> updateCustomer(
            @PathVariable Long customerId,
            @Valid @RequestBody CustomerUpdateRequestDto requestDto) {
        customerService.updateCustomer(customerId, requestDto);
        return ResponseEntity.ok(ApiResponse.success("거래처가 수정되었습니다.", null));
    }

    // ---------- 약국·병원 검색 (거래처 등록 폼 자동채움용) ----------

    @Operation(summary = "약국 검색 (국립중앙의료원 API)")
    @GetMapping("/search/pharmacy")
    public ResponseEntity<ApiResponse<List<MedicalInstSearchDto>>> searchPharmacy(
            @RequestParam(required = false) String sido,
            @RequestParam(required = false) String sigungu,
            @RequestParam(required = false) String name) {
        return ResponseEntity.ok(
                ApiResponse.success(medicalInstSearchService.searchPharmacy(sido, sigungu, name)));
    }

    @Operation(summary = "병의원 검색 (국립중앙의료원 API)")
    @GetMapping("/search/hospital")
    public ResponseEntity<ApiResponse<List<MedicalInstSearchDto>>> searchHospital(
            @RequestParam(required = false) String sido,
            @RequestParam(required = false) String sigungu,
            @RequestParam(required = false) String name) {
        return ResponseEntity.ok(
                ApiResponse.success(medicalInstSearchService.searchHospital(sido, sigungu, name)));
    }

    // ---------- 사업자번호 상태조회 ----------

    @Operation(summary = "사업자번호 상태조회 (국세청 API) - 계속/휴업/폐업 확인")
    @PostMapping("/check-business")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkBusiness(
            @Valid @RequestBody BusinessCheckRequestDto requestDto) {
        Map<String, Object> result = businessVerifyService.checkStatus(requestDto.getBusinessNo());

        boolean valid = Boolean.TRUE.equals(result.get("valid"));
        boolean registered = Boolean.TRUE.equals(result.get("registered"));

        String message;
        if (!registered) {
            message = "국세청에 등록되지 않은 사업자번호입니다.";
        } else if (valid) {
            message = "정상 영업 중인 사업자입니다.";
        } else {
            message = "휴업 또는 폐업 상태인 사업자입니다.";
        }

        return ResponseEntity.ok(ApiResponse.success(message, result));
    }
}