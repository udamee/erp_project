package com.erp.backend.employee.vo;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
public class EmployeeVO {

    private Long empId;
    private String loginId;
    private String password;
    private String empName;
    private String phone;
    private String email;
    private Long deptId;
    private String deptCode;
    private String roleCode;
    private String status;
    private LocalDate hireDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}