package com.erp.backend.employee.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
public class EmployeeResponseDto {

    private Long empId;
    private String loginId;
    private String empName;
    private String phone;
    private String email;
    private Long deptId;
    private String deptName;
    private String roleCode;
    private String status;
    private LocalDate hireDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}