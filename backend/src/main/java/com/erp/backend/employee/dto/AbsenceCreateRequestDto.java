package com.erp.backend.employee.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class AbsenceCreateRequestDto {
    // 결근 직접 생성용
    private Long empId;
    private LocalDate workDate;
    private String status;   // ABSENT / LEAVE
    private String memo;
}
