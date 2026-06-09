package com.erp.backend.auth.service;

import com.erp.backend.auth.dto.LoginRequestDto;
import com.erp.backend.auth.dto.LoginResponseDto;
import com.erp.backend.auth.jwt.JwtTokenProvider;
import com.erp.backend.auth.mapper.AuthMapper;
import com.erp.backend.common.CustomException;
import com.erp.backend.common.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthMapper authMapper;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;

    public LoginResponseDto login(LoginRequestDto requestDto) {
        // 사원 조회
        Map<String, Object> employee = authMapper.findEmployeeByLoginId(requestDto.getLoginId());
        if (employee == null) {
            throw new CustomException(ErrorCode.LOGIN_FAILED);
        }

        // 비밀번호 검증
        if (!passwordEncoder.matches(requestDto.getPassword(),
                (String) employee.get("PASSWORD"))) {
            throw new CustomException(ErrorCode.LOGIN_FAILED);
        }

        String loginId = (String) employee.get("LOGIN_ID");
        String role = (String) employee.get("ROLE_CODE");

        // 토큰 생성
        String accessToken = jwtTokenProvider.generateAccessToken(loginId, role);
        String refreshToken = jwtTokenProvider.generateRefreshToken(loginId);

        return LoginResponseDto.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .empId(((Number) employee.get("EMP_ID")).longValue())
                .loginId((String) employee.get("LOGIN_ID"))
                .empName((String) employee.get("EMP_NAME"))
                .role((String) employee.get("ROLE_CODE"))
                .deptId(((Number) employee.get("DEPT_ID")).longValue())
                .build();
    }
}