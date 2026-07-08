package com.erp.backend.auth.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LoginResponseDto {

    private String accessToken;
    private Long empId;
    private String loginId;
    private String empName;
    private String role;
    private Long deptId;
    private String deptCode;
}