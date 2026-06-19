package com.erp.backend.employee.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class AttendanceSearchCondition {

    // 근태 조회
    private Long empId;     // 특정 사원
    private Long deptId;
    private LocalDate from;
    private LocalDate to;
    private String status;
}
