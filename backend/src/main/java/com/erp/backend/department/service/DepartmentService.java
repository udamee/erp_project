package com.erp.backend.department.service;

import com.erp.backend.common.CustomException;
import com.erp.backend.common.ErrorCode;
import com.erp.backend.department.dto.DepartmentResponseDto;
import com.erp.backend.department.mapper.DepartmentMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentMapper departmentMapper;

    // 부서 전체 조회 (회원가입 폼 부서 선택 등)
    @Transactional(readOnly = true)
    public List<DepartmentResponseDto> getDepartments() {
        return departmentMapper.findAllDepartments();
    }

    // 부서 단건 조회
    @Transactional(readOnly = true)
    public DepartmentResponseDto getDepartment(Long deptId) {
        DepartmentResponseDto department = departmentMapper.findDepartmentById(deptId);

        if (department == null) {
            throw new CustomException(ErrorCode.DEPARTMENT_NOT_FOUND);
        }

        return department;
    }
}
