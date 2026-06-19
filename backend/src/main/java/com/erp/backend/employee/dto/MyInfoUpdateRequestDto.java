package com.erp.backend.employee.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MyInfoUpdateRequestDto {

    private String phone;   // 연락처
    private String email;   // 이메일
    // role/status/password/deptId 등은 의도적으로 제외 (본인이 못 바꿈)
}
