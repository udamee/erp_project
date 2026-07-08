package com.erp.backend.admin.service;

import com.erp.backend.admin.mapper.AdminEmployeeMapper;
import com.erp.backend.auth.mapper.RefreshTokenMapper;
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
    private final RefreshTokenMapper refreshTokenMapper;

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

    // 직원 퇴사 처리(소프트 삭제, STATUS -> INACTIVE)
    // 권한 규칙: 자기 자신 불가 / ADMIN 대상 불가 / HR 매니저는 STAFF만, ADMIN은 STAFF·MANAGER까지
    // actorIsAdmin 은 프론트 입력이 아니라 SecurityContext(Authentication)에서 판단해 전달받는다.
    @Transactional
    public void deleteEmployee(Long actorEmpId, boolean actorIsAdmin, Long targetEmpId) {
        if (actorEmpId.equals(targetEmpId)) {
            throw new CustomException(ErrorCode.FORBIDDEN); // 자기 자신 퇴사 처리 불가
        }

        EmployeeResponseDto target = employeeMapper.findEmployeeById(targetEmpId);
        if (target == null) {
            throw new CustomException(ErrorCode.EMPLOYEE_NOT_FOUND);
        }

        String targetRole = target.getRoleCode();
        if ("ADMIN".equals(targetRole)) {
            throw new CustomException(ErrorCode.FORBIDDEN); // ADMIN 계정은 이 경로로 퇴사 처리 불가
        }
        if (!actorIsAdmin && !"STAFF".equals(targetRole)) {
            throw new CustomException(ErrorCode.FORBIDDEN); // HR 매니저는 STAFF만 퇴사 처리
        }

        if (employeeMapper.deleteEmployee(targetEmpId) == 0) {
            throw new CustomException(ErrorCode.EMPLOYEE_NOT_FOUND);
        }
        // 퇴사 처리 시 해당 직원의 모든 세션(refresh token) 무효화
        refreshTokenMapper.deleteByEmpId(targetEmpId);
    }
}
