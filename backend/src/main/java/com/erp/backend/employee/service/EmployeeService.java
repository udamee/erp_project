package com.erp.backend.employee.service;

import com.erp.backend.employee.dto.*;
import com.erp.backend.employee.mapper.EmployeeMapper;
import com.erp.backend.employee.util.EmployeeStatus;
import com.erp.backend.employee.util.RoleCode;
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

    // create Employee 삭제 (signup과 동일한 기능)

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
        employee.setEmpName(request.getEmpName());
        employee.setPhone(request.getPhone());
        employee.setEmail(request.getEmail());
        employee.setDeptId(request.getDeptId());
        employee.setHireDate(request.getHireDate());

        int result = employeeMapper.updateEmployee(employee);

        if (result == 0) {
            throw new CustomException(ErrorCode.EMPLOYEE_NOT_FOUND);
        }
    }

    //
    @Transactional(readOnly = true)
    public List<EmployeeResponseDto> searchEmployees(EmployeeSearchCondition condition) {
        return employeeMapper.searchEmployeesByCondition(condition);
    }

    // 마이페이지 : 본인 정보 수정 (연락처·이메일만)
    public void updateMyInfo(Long empId, MyInfoUpdateRequestDto request) {
        int result = employeeMapper.updateMyInfo(empId, request.getPhone(), request.getEmail());
        if (result == 0) {
            throw new CustomException(ErrorCode.EMPLOYEE_NOT_FOUND);
        }
    }

    // 권한(역할) 변경 : ADMIN 전용
    public void updateRole(Long empId, String roleCode) {
        // 허용된 역할(STAFF/MANAGER/ADMIN)인지 검증
        try {
            RoleCode.valueOf(roleCode);
        } catch (IllegalArgumentException e) {
            throw new CustomException(ErrorCode.INVALID_ROLE);
        }
        int result = employeeMapper.updateRole(empId, roleCode);
        if (result == 0) {
            throw new CustomException(ErrorCode.EMPLOYEE_NOT_FOUND);
        }
    }

    // 계정 활성/비활성 토글 : ADMIN 전용 (ACTIVE ↔ INACTIVE)
    public void updateAccountStatus(Long empId, String status) {
        // PENDING/REJECTED 로는 변경 불가, ACTIVE/INACTIVE 만 허용
        if (!EmployeeStatus.ACTIVE.name().equals(status)
                && !EmployeeStatus.INACTIVE.name().equals(status)) {
            throw new CustomException(ErrorCode.INVALID_STATUS);
        }
        int result = employeeMapper.updateAccountStatus(empId, status);
        if (result == 0) {
            throw new CustomException(ErrorCode.EMPLOYEE_NOT_FOUND);
        }
    }
}