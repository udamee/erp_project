package com.erp.backend.admin.controller;

import com.erp.backend.admin.service.AdminEmployeeService;
import com.erp.backend.auth.service.AuthService;
import com.erp.backend.common.ApiResponse;
import com.erp.backend.employee.dto.EmployeeResponseDto;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name="관리자", description = "사원 승인 관련 API(ADMIN 전용)")
@RequiredArgsConstructor
@RequestMapping("/api/admin/employees")
@RestController
public class AdminEmployeeController {

    private final AuthService authService;
    private final AdminEmployeeService adminEmployeeService;


    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<EmployeeResponseDto>>> listPendingEmp() {
        return ResponseEntity.ok(ApiResponse.success(adminEmployeeService.getPendingEmployees()));
    }

    public ResponseEntity<ApiResponse<Void>> approve(@PathVariable Long empId) {
        adminEmployeeService.approve(empId);
        return ResponseEntity.ok(ApiResponse.success("사원 등록 완료", null));
    }
}
