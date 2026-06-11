package com.erp.backend.common;

import com.erp.backend.auth.mapper.AuthMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class AuthUtil {

    private final AuthMapper authMapper;

    // loginId로 empId 조회
    public Long getEmpId(String loginId){
        Map<String,Object> employee = authMapper.findEmpIdByLoginId(loginId);
        if (employee == null) {
            throw new CustomException(ErrorCode.EMPLOYEE_NOT_FOUND);
        }
        return ((Number) employee.get("EMP_ID")).longValue();
    }
}
