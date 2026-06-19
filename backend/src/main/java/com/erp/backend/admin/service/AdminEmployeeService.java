package com.erp.backend.admin.service;

import com.erp.backend.admin.mapper.AdminEmployeeMapper;
import com.erp.backend.common.CustomException;
import com.erp.backend.common.ErrorCode;
import com.erp.backend.employee.dto.EmployeeResponseDto;
import com.erp.backend.employee.mapper.EmployeeMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminEmployeeService {

    private final AdminEmployeeMapper adminEmployeeMapper;
    private final EmployeeMapper employeeMapper;

    // 등록 직후 STATUS=PENDING 인 직원 조회
    @Transactional(readOnly = true)
    public List<EmployeeResponseDto> getPendingEmployees() {
        return adminEmployeeMapper.findByStatus("PENDING");
    }

    // 관리자 : 직원(PENDING) 승인(approve), PENDING -> ACTIVE
    @Transactional
    public void approve(Long empId) {
        if (adminEmployeeMapper.updateStatus(empId, "ACTIVE") == 0) {
            throw new CustomException(ErrorCode.EMPLOYEE_NOT_FOUND);
        }
    }

    // 관리자 : 직원(PENDING) 등록 거절, PENDING -> REJECT
    @Transactional
    public void reject(Long empId) {
        if (adminEmployeeMapper.updateStatus(empId, "REJECTED") == 0) {
            throw new CustomException(ErrorCode.EMPLOYEE_NOT_FOUND);
        }
    }

    // 관리자 : 직원 삭제(소프트 삭제, STATUS -> INACTIVE)
    @Transactional
    public void deleteEmployee(Long empId) {
        if (employeeMapper.deleteEmployee(empId) == 0) {
            throw new CustomException(ErrorCode.EMPLOYEE_NOT_FOUND);
        }
    }
}
