package com.erp.backend.customer.dto;

import lombok.Builder;
import lombok.Getter;

/**
 * 약국·병원 검색 결과 1건
 * 거래처 등록 폼에 자동 채울 정보만 담음
 */
@Getter
@Builder
public class MedicalInstSearchDto {

    private String name;     // 기관명 (dutyName)
    private String type;     // PHARMACY / HOSPITAL
    private String phone;    // 전화번호 (dutyTel1)
    private String address;  // 주소 (dutyAddr)
}