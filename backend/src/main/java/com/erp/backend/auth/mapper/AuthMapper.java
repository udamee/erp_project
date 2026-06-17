package com.erp.backend.auth.mapper;

import com.erp.backend.auth.dto.SignupRequestDto;

import com.erp.backend.employee.vo.EmployeeVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface AuthMapper {

    // 로그인ID로 직원 조회
    EmployeeVO findEmployeeByLoginId(String loginId);
    // 사원ID로 직원 조회
    EmployeeVO findEmployeeByEmpId(Long empId);

    // 로그인ID로 사원 조회
    boolean existsEmployeeByLoginId(String loginId);
    // 관리자(MANAGER)의 직원 등록
    void insertEmployee(@Param("dto") SignupRequestDto dto, @Param("encodedPassword") String encodedPassword);
    // 비밀번호 변경
    int updatePassword(@Param("empId") Long empId, @Param("encodedPassword") String encodedPassword);
}