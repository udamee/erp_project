package com.erp.backend.employee.service;

import com.erp.backend.auth.mapper.RefreshTokenMapper;
import com.erp.backend.employee.dto.*;
import com.erp.backend.employee.mapper.EmployeeMapper;
import com.erp.backend.employee.util.EmployeeStatus;
import com.erp.backend.employee.util.RoleCode;
import com.erp.backend.employee.vo.EmployeeVO;
import com.erp.backend.common.CustomException;
import com.erp.backend.common.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class EmployeeService {

    private final EmployeeMapper employeeMapper;
    private final RefreshTokenMapper refreshTokenMapper;
    private final PasswordEncoder passwordEncoder;

    // 관리자 직원 직접 등록 : 승인 절차 없이 역할·상태·입사일을 지정해 바로 생성한다.
    // (일반 가입은 signup → PENDING 승인 흐름을 사용한다.)
    public Long createEmployee(EmployeeCreateRequestDto request, boolean creatorIsAdmin) {
        if (employeeMapper.countByLoginId(request.getLoginId()) > 0) {
            throw new CustomException(ErrorCode.EMPLOYEE_ALREADY_EXISTS);
        }

        // 역할: 미지정이면 STAFF, 지정 시 STAFF/MANAGER/ADMIN 만 허용
        String roleCode = (request.getRoleCode() == null || request.getRoleCode().isBlank())
                ? RoleCode.STAFF.name() : request.getRoleCode();
        if (roleCode == null || roleCode.isBlank()) {
            throw new CustomException(ErrorCode.INVALID_ROLE);
        }
        String normalizedRoleCode = roleCode.trim().toUpperCase();
        try {
            RoleCode.valueOf(normalizedRoleCode);
        } catch (IllegalArgumentException e) {
            throw new CustomException(ErrorCode.INVALID_ROLE);
        }

        // 권한 상승(Privilege Escalation) 방지:
        // 역할 부여/변경은 ADMIN 전용이므로(authorization-guide.md §5),
        // ADMIN이 아닌 등록자(인사부 매니저)는 STAFF만 생성할 수 있다.
        if (!creatorIsAdmin && !RoleCode.STAFF.name().equals(normalizedRoleCode)) {
            throw new CustomException(ErrorCode.FORBIDDEN);
        }

        // 상태: 미지정이면 ACTIVE, 직접 등록은 ACTIVE/INACTIVE 만 허용 (PENDING/REJECTED 흐름 제외)
        String status = (request.getStatus() == null || request.getStatus().isBlank())
                ? EmployeeStatus.ACTIVE.name() : request.getStatus();
        String normalizedStatus = status.trim().toUpperCase();
        if (!EmployeeStatus.ACTIVE.name().equals(normalizedStatus)
                && !EmployeeStatus.INACTIVE.name().equals(normalizedStatus)) {
            throw new CustomException(ErrorCode.INVALID_STATUS);
        }

        EmployeeVO employee = new EmployeeVO();
        employee.setLoginId(request.getLoginId());
        employee.setPassword(passwordEncoder.encode(request.getPassword()));
        employee.setEmpName(request.getEmpName());
        employee.setPhone(request.getPhone());
        employee.setEmail(request.getEmail());
        employee.setDeptId(request.getDeptId());
        employee.setRoleCode(normalizedRoleCode);
        employee.setStatus(normalizedStatus);
        employee.setHireDate(request.getHireDate() != null ? request.getHireDate() : LocalDate.now());

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
        EmployeeResponseDto current = employeeMapper.findEmployeeById(empId);
        if (current == null) {
            throw new CustomException(ErrorCode.EMPLOYEE_NOT_FOUND);
        }

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

        if (request.getDeptId() != null && !request.getDeptId().equals(current.getDeptId())) {
            refreshTokenMapper.deleteByEmpId(empId);
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
        if (roleCode == null || roleCode.isBlank()) {
            throw new CustomException(ErrorCode.INVALID_ROLE);
        }
        String normalizedRoleCode = roleCode.trim().toUpperCase();
        // 허용된 역할(STAFF/MANAGER/ADMIN)인지 검증
        try {
            RoleCode.valueOf(normalizedRoleCode);
        } catch (IllegalArgumentException e) {
            throw new CustomException(ErrorCode.INVALID_ROLE);
        }
        int result = employeeMapper.updateRole(empId, normalizedRoleCode);
        if (result == 0) {
            throw new CustomException(ErrorCode.EMPLOYEE_NOT_FOUND);
        }
        refreshTokenMapper.deleteByEmpId(empId);
    }

    // 계정 활성/비활성 토글 : ADMIN 전용 (ACTIVE ↔ INACTIVE)
    public void updateAccountStatus(Long empId, String status) {
        // PENDING/REJECTED 로는 변경 불가, ACTIVE/INACTIVE 만 허용
        if (status == null || status.isBlank()) {
            throw new CustomException(ErrorCode.INVALID_STATUS);
        }
        String normalizedStatus = status.trim().toUpperCase();
        if (!EmployeeStatus.ACTIVE.name().equals(normalizedStatus)
                && !EmployeeStatus.INACTIVE.name().equals(normalizedStatus)) {
            throw new CustomException(ErrorCode.INVALID_STATUS);
        }
        int result = employeeMapper.updateAccountStatus(empId, normalizedStatus);
        if (result == 0) {
            throw new CustomException(ErrorCode.EMPLOYEE_NOT_FOUND);
        }
        // 비활성화 시 해당 직원의 세션(refresh token) 무효화 (재활성화는 제외)
        if (EmployeeStatus.INACTIVE.name().equals(normalizedStatus)) {
            refreshTokenMapper.deleteByEmpId(empId);
        }
    }
}
