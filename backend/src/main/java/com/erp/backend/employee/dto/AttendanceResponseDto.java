package com.erp.backend.employee.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
public class AttendanceResponseDto {
    private Long attendanceId;
    private Long empId;
    private String empName;     // EMPLOYEE 조인 결과
    private LocalDate workDate;
    private LocalDateTime checkIn;
    private LocalDateTime checkOut;
    private BigDecimal workHours;
    private String status;
    private String memo;
}
