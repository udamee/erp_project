package com.erp.backend.employee.mapper;


import com.erp.backend.employee.dto.EmployeeResponseDto;
import com.erp.backend.employee.dto.EmployeeSearchCondition;
import com.erp.backend.employee.vo.EmployeeVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface EmployeeMapper {

    int insertEmployee(EmployeeVO employee);

    List<EmployeeResponseDto> findAllEmployees();

    EmployeeResponseDto findEmployeeById(Long empId);

    int updateEmployee(EmployeeVO employee);

    int deleteEmployee(Long empId);

    int countByLoginId(String loginId);

    List<EmployeeResponseDto> searchEmployeesByCondition(EmployeeSearchCondition  condition);

    int updateMyInfo(@Param("empId") Long empId,
                     @Param("phone") String phone,
                     @Param("email") String email);

    // 권한(역할) 변경
    int updateRole(@Param("empId") Long empId, @Param("roleCode") String roleCode);

    // 계정 활성/비활성 토글
    int updateAccountStatus(@Param("empId") Long empId, @Param("status") String status);
}