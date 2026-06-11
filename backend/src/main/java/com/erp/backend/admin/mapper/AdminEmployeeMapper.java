package com.erp.backend.admin.mapper;

import com.erp.backend.employee.dto.EmployeeResponseDto;
import com.erp.backend.employee.vo.EmployeeVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface AdminEmployeeMapper {

    List<EmployeeResponseDto> findByStatus(String status);
    EmployeeVO findEmployeeByStatus(String status);
    int updateStatus(@Param("empId") Long empId, @Param("status") String status);
}
