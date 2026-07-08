package com.erp.backend.employee.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class AttendanceUpdateRequestDto {

    // 관리자의 근태 보정용
    private LocalDateTime checkIn;
    private LocalDateTime checkOut;
    private String status;   // NORMAL / LATE / EARLY_LEAVE ...
    private String memo;
}
