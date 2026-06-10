package com.erp.backend.employee.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class EmployeeUpdateRequestDto {

    private String password; //로그인 패스워드
    private String empName; //직원이름
    private String phone; //직원 연락처
    private String email; //직원 이메일
    private Long deptId; //직원 부서
    private String roleCode; //직원 권한
    private String status; //재직여부
    private LocalDate hireDate; //입사일
}