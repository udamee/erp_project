package com.erp.backend.admin.controller;

import com.erp.backend.admin.service.AdminAttendanceService;
import com.erp.backend.common.ApiResponse;
import com.erp.backend.employee.dto.AbsenceCreateRequestDto;
import com.erp.backend.employee.dto.AttendanceResponseDto;
import com.erp.backend.employee.dto.AttendanceSearchCondition;
import com.erp.backend.employee.dto.AttendanceUpdateRequestDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "관리자 근태", description = "근태 조회/보정 관련 API(MANAGER, ADMIN 전용)")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/attendance")
@PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
public class AdminAttendanceController {

    private final AdminAttendanceService adminAttendanceService;

    @Operation(summary = "근태 현황 검색")
    @GetMapping
    public ApiResponse<List<AttendanceResponseDto>> adminAttendanceSearch(AttendanceSearchCondition condition) {
        return ApiResponse.success(adminAttendanceService.search(condition));
    }

    @Operation(summary = "근태 단건 조회")
    @GetMapping("/{attendanceId}")
    public ApiResponse<AttendanceResponseDto> adminGetOneEmpAttendance(@PathVariable Long attendanceId) {
        return ApiResponse.success(adminAttendanceService.getById(attendanceId));
    }

    @Operation(summary = "근태 보정")
    @PutMapping("/{attendanceId}")
    public ApiResponse<Void> adminUpdateAttendance(
            @PathVariable Long attendanceId,
            @RequestBody AttendanceUpdateRequestDto request
    ) {
        adminAttendanceService.adminUpdateAttendance(attendanceId, request);
        return ApiResponse.success("근태가 수정되었습니다.", null);
    }

    // 결근/휴가 직접 등록
    @Operation(summary = "결근/휴가 직접 등록")
    @PostMapping("/absence")
    public ApiResponse<AttendanceResponseDto> adminCreateAbsence(@RequestBody AbsenceCreateRequestDto request) {
        return ApiResponse.success("등록되었습니다.", adminAttendanceService.adminCreateAbsence(request));
    }
}
