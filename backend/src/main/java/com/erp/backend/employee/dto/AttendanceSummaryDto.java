package com.erp.backend.employee.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class AttendanceSummaryDto {

    private Long empId;
    private String empName;     // EMPLOYEE 조인 결과
    private Long deptId;        // EMPLOYEE 조인 결과
    private String deptName;    // DEPARTMENT 조인 결과

    // 집계 기간
    private LocalDate from;
    private LocalDate to;

    // 상태별 집계
    private int totalDays;       // 기록된 근태 일수
    private int normalCount;     // 정상
    private int lateCount;       // 지각
    private int earlyLeaveCount; // 조퇴
    private int absentCount;     // 결근
    private int leaveCount;      // 휴가/연차

    // 총 근무시간
    private BigDecimal totalWorkHours;
}
