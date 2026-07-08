package com.erp.backend.employee.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EmployeeSearchCondition {
    private Long deptId;       // 부서
    private String empName;    // 이름 (부분 검색)
    private String roleCode;   // 직급/역할
}

