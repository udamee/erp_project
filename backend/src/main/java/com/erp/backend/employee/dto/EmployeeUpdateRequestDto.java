package com.erp.backend.employee.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class EmployeeUpdateRequestDto {

    // password 는 reset-password, roleCode 는 /role, status 는 /status 전용 API로 분리
    private String empName; //직원이름
    private String phone; //직원 연락처
    private String email; //직원 이메일
    private Long deptId; //직원 부서
    private LocalDate hireDate; //입사일
}