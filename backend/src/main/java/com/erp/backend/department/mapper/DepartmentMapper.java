package com.erp.backend.department.mapper;

import com.erp.backend.department.dto.DepartmentResponseDto;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface DepartmentMapper {

    List<DepartmentResponseDto> findAllDepartments();
    DepartmentResponseDto findDepartmentById(Long deptId);
}
