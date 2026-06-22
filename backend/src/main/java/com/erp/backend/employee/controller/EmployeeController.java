package com.erp.backend.employee.controller;

import org.springframework.web.bind.annotation.RestController;


import com.erp.backend.common.ApiResponse;
import com.erp.backend.employee.dto.EmployeeResponseDto;
import com.erp.backend.employee.dto.EmployeeSearchCondition;
import com.erp.backend.employee.dto.EmployeeUpdateRequestDto;
import com.erp.backend.employee.dto.MyInfoUpdateRequestDto;
import com.erp.backend.employee.dto.ResetPasswordRequestDto;
import com.erp.backend.employee.dto.RoleUpdateRequestDto;
import com.erp.backend.employee.dto.StatusUpdateRequestDto;
import com.erp.backend.employee.service.EmployeeService;
import com.erp.backend.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;
    private final AuthService authService;

    // create Employee 삭제 -> signup과 동일한 기능

    @GetMapping
    @PreAuthorize("hasAuthority('DEPT_HR')") // HR 부서 + ADMIN(부서권한 자동 보유)
    public ApiResponse<List<EmployeeResponseDto>> getEmployees(EmployeeSearchCondition condition) {
        return ApiResponse.success(employeeService.searchEmployees(condition));
    }

    @GetMapping("/{empId}")
    @PreAuthorize("hasAuthority('DEPT_HR')") // 직원 단건 조회는 HR 부서 + ADMIN만 (본인 확인은 /me 사용)
    public ApiResponse<EmployeeResponseDto> getEmployee(@PathVariable Long empId) {
        return ApiResponse.success(employeeService.getEmployee(empId));
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()") // 로그인한 본인만 접근 (empId는 토큰에서)
    public ApiResponse<EmployeeResponseDto> getMyPage(@AuthenticationPrincipal Long empId) {
        // 내 정보 조회 후 반환
        return ApiResponse.success(employeeService.getEmployee(empId));
    }


    @PutMapping("/{empId}")
    @PreAuthorize("hasRole('ADMIN')") // 관리자 직원 수정은 ADMIN 전용
    public ApiResponse<Void> updateEmployee(
            @PathVariable Long empId,
            @RequestBody EmployeeUpdateRequestDto request
    ) {
        employeeService.updateEmployee(empId, request);
        return ApiResponse.success("직원 정보 수정 완료", null);
    }

    // 마이페이지 : 본인 정보 수정 (연락처·이메일만, empId는 토큰에서)
    @PutMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Void> updateMyInfo(
            @AuthenticationPrincipal Long empId,
            @RequestBody MyInfoUpdateRequestDto request
    ) {
        employeeService.updateMyInfo(empId, request);
        return ApiResponse.success("내 정보 수정 완료", null);
    }

    // 권한(역할) 변경 : ADMIN 전용 (STAFF/MANAGER/ADMIN 간 변경)
    @PatchMapping("/{empId}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> updateRole(
            @PathVariable Long empId,
            @Valid @RequestBody RoleUpdateRequestDto request
    ) {
        employeeService.updateRole(empId, request.getRoleCode());
        return ApiResponse.success("역할 변경 완료", null);
    }

    // 계정 활성/비활성 토글 : ADMIN 전용 (ACTIVE ↔ INACTIVE)
    @PatchMapping("/{empId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> updateAccountStatus(
            @PathVariable Long empId,
            @Valid @RequestBody StatusUpdateRequestDto request
    ) {
        employeeService.updateAccountStatus(empId, request.getStatus());
        return ApiResponse.success("계정 상태 변경 완료", null);
    }

    // 비밀번호 초기화 : ADMIN 전용 (현재 비번 확인 없이 새 비번으로 재설정)
    @PatchMapping("/{empId}/reset-password")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> resetPassword(
            @PathVariable Long empId,
            @Valid @RequestBody ResetPasswordRequestDto request
    ) {
        authService.resetPassword(empId, request.getNewPassword());
        return ApiResponse.success("비밀번호 초기화 완료", null);
    }
}