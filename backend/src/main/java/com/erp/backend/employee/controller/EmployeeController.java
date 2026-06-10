package com.erp.backend.employee.controller;

import org.springframework.web.bind.annotation.RestController;


import com.erp.backend.employee.dto.EmployeeCreateRequestDto;
import com.erp.backend.employee.dto.EmployeeResponseDto;
import com.erp.backend.employee.dto.EmployeeUpdateRequestDto;
import com.erp.backend.employee.service.EmployeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;

    @PostMapping
    public Long createEmployee(@RequestBody EmployeeCreateRequestDto request) {
        return employeeService.createEmployee(request);
    }

    @GetMapping
    public List<EmployeeResponseDto> getEmployees() {
        return employeeService.getEmployees();
    }

    @GetMapping("/{empId}")
    public EmployeeResponseDto getEmployee(@PathVariable Long empId) {
        return employeeService.getEmployee(empId);
    }

    @PutMapping("/{empId}")
    public void updateEmployee(
            @PathVariable Long empId,
            @RequestBody EmployeeUpdateRequestDto request
    ) {
        employeeService.updateEmployee(empId, request);
    }

    @DeleteMapping("/{empId}")
    public void deleteEmployee(@PathVariable Long empId) {
        employeeService.deleteEmployee(empId);
    }
}
