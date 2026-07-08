package com.erp.backend.employee.controller;

import com.erp.backend.common.ApiResponse;
import com.erp.backend.employee.dto.AttendanceResponseDto;
import com.erp.backend.employee.service.AttendanceService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;

    // ===== 본인용 (empId는 토큰에서) =====

    @PostMapping("/check-in")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<AttendanceResponseDto> checkIn(@AuthenticationPrincipal Long empId) {
        return ApiResponse.success("출근 처리되었습니다.", attendanceService.checkIn(empId));
    }

    @PatchMapping("/check-out")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<AttendanceResponseDto> checkOut(@AuthenticationPrincipal Long empId) {
        return ApiResponse.success("퇴근 처리되었습니다.", attendanceService.checkOut(empId));
    }

    @Operation(summary = "직원의 당일 근태 조회")
    @GetMapping("/me/today")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<AttendanceResponseDto> getMyToday(@AuthenticationPrincipal Long empId) {
        return ApiResponse.success(attendanceService.getToday(empId));
    }

    @Operation(summary = "직원의 근태 현황 조회")
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<AttendanceResponseDto>> getMyAttendances(
            @AuthenticationPrincipal Long empId,
            @RequestParam LocalDate from,
            @RequestParam LocalDate to
    ) {
        return ApiResponse.success(attendanceService.getMyAttendances(empId, from, to));
    }

}
