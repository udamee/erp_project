package com.erp.backend.department.controller;

import com.erp.backend.common.ApiResponse;
import com.erp.backend.department.dto.DepartmentResponseDto;
import com.erp.backend.department.service.DepartmentService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "부서", description = "부서 조회 API")
@RequiredArgsConstructor
@RequestMapping("/api/departments")
@RestController
public class DepartmentController {

    private final DepartmentService departmentService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<DepartmentResponseDto>>> listDepartments() {
        return ResponseEntity.ok(ApiResponse.success(departmentService.getDepartments()));
    }

    @GetMapping("/{deptId}")
    public ResponseEntity<ApiResponse<DepartmentResponseDto>> getDepartment(@PathVariable Long deptId) {
        return ResponseEntity.ok(ApiResponse.success(departmentService.getDepartment(deptId)));
    }
}
