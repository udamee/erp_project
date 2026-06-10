package com.erp.backend.employee.mapper;


import com.erp.backend.employee.dto.EmployeeResponseDto;
import com.erp.backend.employee.vo.EmployeeVO;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface EmployeeMapper {

    int insertEmployee(EmployeeVO employee);

    List<EmployeeResponseDto> findAllEmployees();

    EmployeeResponseDto findEmployeeById(Long empId);

    int updateEmployee(EmployeeVO employee);

    int deleteEmployee(Long empId);

    int countByLoginId(String loginId);
}