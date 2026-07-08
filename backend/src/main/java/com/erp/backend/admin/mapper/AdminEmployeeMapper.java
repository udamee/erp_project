package com.erp.backend.admin.mapper;

import com.erp.backend.employee.dto.EmployeeResponseDto;
import com.erp.backend.employee.vo.EmployeeVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface AdminEmployeeMapper {

    // 직원 조회(STATUS로 조회)
    List<EmployeeResponseDto> findByStatus(String status);
    int updateStatus(@Param("empId") Long empId, @Param("status") String status);
}
