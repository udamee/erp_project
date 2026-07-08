package com.erp.backend.employee.controller;

import org.springframework.web.bind.annotation.RestController;


import com.erp.backend.common.ApiResponse;
import com.erp.backend.employee.dto.EmployeeCreateRequestDto;
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
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;
    private final AuthService authService;

    // 직원 직접 등록 : 승인 절차 없이 역할·상태·입사일을 지정해 생성
    // 인사부 매니저 + 관리자 (authorization-guide.md 4-1 · POST /api/employees)
    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN') and hasAuthority('DEPT_HR')")
    public ApiResponse<Long> createEmployee(@Valid @RequestBody EmployeeCreateRequestDto request,
                                            Authentication authentication) {
        // 권한 상승 방지: 역할 부여는 ADMIN만 가능 (서비스에서 STAFF 외 역할 차단)
        boolean creatorIsAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        return ApiResponse.success("직원 등록 완료", employeeService.createEmployee(request, creatorIsAdmin));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN') and hasAuthority('DEPT_HR')") // 직원 관리는 인사부 매니저 + 관리자
    public ApiResponse<List<EmployeeResponseDto>> getEmployees(EmployeeSearchCondition condition) {
        return ApiResponse.success(employeeService.searchEmployees(condition));
    }

    @GetMapping("/{empId}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN') and hasAuthority('DEPT_HR')") // 직원 단건 조회는 인사부 매니저 + 관리자 (본인 확인은 /me 사용)
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