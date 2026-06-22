package com.erp.backend.admin.controller;

import com.erp.backend.admin.service.AdminEmployeeService;
import com.erp.backend.common.ApiResponse;
import com.erp.backend.employee.dto.EmployeeResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name="관리자", description = "사원 승인 관련 API(ADMIN, HR MGR 전용)")
@RequiredArgsConstructor
@RequestMapping("/api/admin/employees")
@RestController
@PreAuthorize("hasAuthority('DEPT_HR')")
public class AdminEmployeeController {

    private final AdminEmployeeService adminEmployeeService;

    @Operation(summary = "가입 등록 대기(PENDING) 직원 상태 확인")
    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<EmployeeResponseDto>>> listPendingEmp() {
        return ResponseEntity.ok(ApiResponse.success(adminEmployeeService.getPendingEmployees()));
    }

    @Operation(summary = "등록 승인")
    @PostMapping("/{empId}/approve")
    public ResponseEntity<ApiResponse<Void>> approve(@PathVariable Long empId) {
        adminEmployeeService.approve(empId);
        return ResponseEntity.ok(ApiResponse.success("사원 가입 승인 완료", null));
    }

    @Operation(summary = "등록 거절")
    @PostMapping("/{empId}/reject")
    public ResponseEntity<ApiResponse<Void>> reject(@PathVariable Long empId){
        adminEmployeeService.reject(empId);
        return ResponseEntity.ok(ApiResponse.success("사원 가입 승인 거절", null));
    }

    // 퇴사 처리: HR 매니저 이상만(클래스의 DEPT_HR + 메서드의 MANAGER 조합). 대상 역할 검사는 서비스에서.
    @Operation(summary = "직원 퇴사 처리")
    @DeleteMapping("/{empId}")
    @PreAuthorize("hasRole('MANAGER') and hasAuthority('DEPT_HR')")
    public ResponseEntity<ApiResponse<Void>> deleteEmployee(
            @PathVariable Long empId,
            @AuthenticationPrincipal Long actorEmpId,
            Authentication authentication) {
        boolean actorIsAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        adminEmployeeService.deleteEmployee(actorEmpId, actorIsAdmin, empId);
        return ResponseEntity.ok(ApiResponse.success("사원 퇴사 처리 완료", null));
    }
}
