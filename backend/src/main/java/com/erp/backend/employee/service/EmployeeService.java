package com.erp.backend.employee.service;

import com.erp.backend.employee.dto.EmployeeCreateRequestDto;
import com.erp.backend.employee.dto.EmployeeResponseDto;
import com.erp.backend.employee.dto.EmployeeUpdateRequestDto;
import com.erp.backend.employee.mapper.EmployeeMapper;
import com.erp.backend.employee.vo.EmployeeVO;
import com.erp.backend.common.CustomException;
import com.erp.backend.common.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class EmployeeService {

    private final EmployeeMapper employeeMapper;

    public Long createEmployee(EmployeeCreateRequestDto request) {

        int count = employeeMapper.countByLoginId(request.getLoginId());

        if (count > 0) {
            throw new CustomException(ErrorCode.EMPLOYEE_ALREADY_EXISTS);
        }

        EmployeeVO employee = new EmployeeVO();
        employee.setLoginId(request.getLoginId());
        employee.setPassword(request.getPassword());
        employee.setEmpName(request.getEmpName());
        employee.setPhone(request.getPhone());
        employee.setEmail(request.getEmail());
        employee.setDeptId(request.getDeptId());
        employee.setRoleCode(request.getRoleCode());
        employee.setStatus(
                request.getStatus() == null ? "ACTIVE" : request.getStatus()
        );
        employee.setHireDate(request.getHireDate());

        employeeMapper.insertEmployee(employee);

        return employee.getEmpId();
    }

    @Transactional(readOnly = true)
    public List<EmployeeResponseDto> getEmployees() {
        return employeeMapper.findAllEmployees();
    }

    @Transactional(readOnly = true)
    public EmployeeResponseDto getEmployee(Long empId) {

        EmployeeResponseDto employee = employeeMapper.findEmployeeById(empId);

        if (employee == null) {
            throw new CustomException(ErrorCode.EMPLOYEE_NOT_FOUND);
        }

        return employee;
    }

    public void updateEmployee(Long empId, EmployeeUpdateRequestDto request) {

        EmployeeVO employee = new EmployeeVO();
        employee.setEmpId(empId);
        employee.setPassword(request.getPassword());
        employee.setEmpName(request.getEmpName());
        employee.setPhone(request.getPhone());
        employee.setEmail(request.getEmail());
        employee.setDeptId(request.getDeptId());
        employee.setRoleCode(request.getRoleCode());
        employee.setStatus(request.getStatus());
        employee.setHireDate(request.getHireDate());

        int result = employeeMapper.updateEmployee(employee);

        if (result == 0) {
            throw new CustomException(ErrorCode.EMPLOYEE_NOT_FOUND);
        }
    }

    public void deleteEmployee(Long empId) {

        int result = employeeMapper.deleteEmployee(empId);

        if (result == 0) {
            throw new CustomException(ErrorCode.EMPLOYEE_NOT_FOUND);
        }
    }
}
