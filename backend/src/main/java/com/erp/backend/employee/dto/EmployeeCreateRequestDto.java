package com.erp.backend.employee.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class EmployeeCreateRequestDto {
    private String loginId; //로그인에 사용되는 직원id
    private String password; //로그인에 사용되는 pw
    private String empName; //직원이름
    private String phone; //직원연락처
    private String email; //직원이메일
    private Long deptId; //직원부서
    private String roleCode; //직원 권한부여코드
    private String status; //직원 재직여부
    private LocalDate hireDate; //입사일
}
