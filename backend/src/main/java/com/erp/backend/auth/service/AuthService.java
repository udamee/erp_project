package com.erp.backend.auth.service;

import com.erp.backend.auth.dto.ChangePasswordRequestDto;
import com.erp.backend.auth.dto.LoginRequestDto;
import com.erp.backend.auth.dto.LoginResponseDto;
import com.erp.backend.auth.dto.LoginResult;
import com.erp.backend.auth.dto.SignupRequestDto;
import com.erp.backend.auth.jwt.JwtTokenProvider;
import com.erp.backend.auth.mapper.AuthMapper;
import com.erp.backend.auth.mapper.RefreshTokenMapper;
import com.erp.backend.auth.vo.RefreshTokenVO;
import com.erp.backend.common.CustomException;
import com.erp.backend.employee.util.EmployeeStatus;
import com.erp.backend.common.ErrorCode;
import com.erp.backend.employee.vo.EmployeeVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthMapper authMapper;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenMapper refreshTokenMapper;

    @Value("${jwt.refresh-token-expiration}")
    private long refreshTokenExpiration;

    // 1. 로그인
    public LoginResult login(LoginRequestDto requestDto) {
        // 사원 조회
        EmployeeVO employee = authMapper.findEmployeeByLoginId(requestDto.getLoginId());
        // 로그인ID 등록 검증
        if (employee == null) {
            throw new CustomException(ErrorCode.LOGIN_FAILED);
        }

        // 비밀번호 검증
        if (!passwordEncoder.matches(requestDto.getPassword(), employee.getPassword())) {
            throw new CustomException(ErrorCode.LOGIN_FAILED);
        }

        // 계정 상태 검증 (비밀번호 검증 후에 해야 계정 존재 여부가 노출되지 않음)
        if (EmployeeStatus.PENDING.name().equals(employee.getStatus())) {
            throw new CustomException(ErrorCode.ACCOUNT_PENDING);
        }
        if (EmployeeStatus.INACTIVE.name().equals(employee.getStatus())) {
            throw new CustomException(ErrorCode.ACCOUNT_INACTIVE);
        }
        if (!EmployeeStatus.ACTIVE.name().equals(employee.getStatus())) {
            throw new CustomException(ErrorCode.ACCOUNT_REJECTED);
        }

        Long empId = employee.getEmpId();
        String role = employee.getRoleCode();
        String deptCode = employee.getDeptCode();
        List<String> exAuths = authMapper.findExceptionAuths(deptCode, "ROLE_" +role);


        // 토큰 생성
        String accessToken = jwtTokenProvider.generateAccessToken(empId, deptCode, role, exAuths);
        String refreshToken = jwtTokenProvider.generateRefreshToken(empId);

        // Refresh Token DB 저장
        refreshTokenMapper.saveRefreshToken(jwtTokenProvider.getTokenId(refreshToken), empId,
                LocalDateTime.now().plus(refreshTokenExpiration, ChronoUnit.MILLIS));

        return new LoginResult(refreshToken, buildResponse(employee, accessToken));
    }

    // 2. 회원 가입
    @Transactional
    public void signup(SignupRequestDto dto) {
        if (authMapper.existsEmployeeByLoginId(dto.getLoginId())) {
            throw new CustomException(ErrorCode.EMPLOYEE_ALREADY_EXISTS);
        }
        authMapper.insertEmployee(dto, passwordEncoder.encode(dto.getPassword()));
    }

    // 3. 토큰 재발급
    @Transactional
    public LoginResult refreshToken(String refreshToken) {
        if (!StringUtils.hasText(refreshToken) || !jwtTokenProvider.validateToken(refreshToken)) {
            throw new CustomException(ErrorCode.REFRESH_TOKEN_INVALID);
        }

        if (!"refresh".equals(jwtTokenProvider.getTokenType(refreshToken))) {
            throw new CustomException(ErrorCode.REFRESH_TOKEN_INVALID);
        }

        String jwtId = jwtTokenProvider.getTokenId(refreshToken);
        if (refreshTokenMapper.findByJwtId(jwtId) == null) {
            throw new CustomException(ErrorCode.REFRESH_TOKEN_INVALID);
        }
        refreshTokenMapper.deleteByJwtId(jwtId); // 오래된 Refresh Token 삭제

        Long empId = jwtTokenProvider.getEmpId(refreshToken);
        EmployeeVO employee = authMapper.findEmployeeByEmpId(empId);
        if (employee == null) {
            throw new CustomException(ErrorCode.EMPLOYEE_NOT_FOUND);
        }

        String role = employee.getRoleCode();
        String deptCode = employee.getDeptCode();
        List<String> exAuths = authMapper.findExceptionAuths(deptCode, "ROLE_" +role);
        String newAccessToken = jwtTokenProvider.generateAccessToken(empId, deptCode, role, exAuths);
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(empId);

        refreshTokenMapper.saveRefreshToken(
                jwtTokenProvider.getTokenId(newRefreshToken),
                empId,
                LocalDateTime.now().plus(refreshTokenExpiration, ChronoUnit.MILLIS));

        return new LoginResult(newRefreshToken, buildResponse(employee, newAccessToken));
    }

    // 4. 로그아웃 (Refresh Token 삭제 - Access Token은 만료될 때까지 유지)
    // 로그아웃은 항상 성공 처리. 토큰이 없거나 유효하지 않아도 예외를 던지지 않으며,
    // 쿠키 삭제는 컨트롤러가 항상 수행
    public void logout(String refreshToken) {

        // 1) 토큰이 없거나 유효하지 않으면 DB 정리 없이 종료
        if (!StringUtils.hasText(refreshToken) || !jwtTokenProvider.validateToken(refreshToken)) {
            return;
        }

        // 2) 타입이 refresh가 아니면 종료
        if (!"refresh".equals(jwtTokenProvider.getTokenType(refreshToken))) {
            return;
        }

        // 3) JTI로 DB에 저장된 Refresh Token 조회 -> 있으면 삭제
        String jwtId = jwtTokenProvider.getTokenId(refreshToken);
        RefreshTokenVO stored = refreshTokenMapper.findByJwtId(jwtId);
        if (stored != null) {
            refreshTokenMapper.deleteByJwtId(jwtId);
        }
    }

    // 5. 비밀번호 변경
    @Transactional
    public void changePassword(Long empId, ChangePasswordRequestDto dto) {
        EmployeeVO employee = authMapper.findEmployeeByEmpId(empId);
        if (employee == null) {
            throw new CustomException(ErrorCode.EMPLOYEE_NOT_FOUND);
        }

        // 1) 현재 비밀번호 확인
        if (!passwordEncoder.matches(dto.getCurrentPassword(), employee.getPassword())) {
            throw new CustomException(ErrorCode.PASSWORD_MISMATCH);
        }

        // 2) 새 비밀번호와 확인 일치 여부
        if (!dto.getNewPassword().equals(dto.getCheckNewPassword())) {
            throw new CustomException(ErrorCode.PASSWORD_CONFIRM_MISMATCH);
        }

        // 3) 기존 비밀번호와 동일한지 확인
        if (passwordEncoder.matches(dto.getNewPassword(), employee.getPassword())) {
            throw new CustomException(ErrorCode.SAME_AS_CURRENT_PASSWORD);
        }

        authMapper.updatePassword(empId, passwordEncoder.encode(dto.getNewPassword()));
    }

    // 5-1. 관리자 비밀번호 초기화 (현재 비번 확인 없이 새 비번으로 재설정, ADMIN 전용)
    @Transactional
    public void resetPassword(Long empId, String newPassword) {
        EmployeeVO employee = authMapper.findEmployeeByEmpId(empId);
        if (employee == null) {
            throw new CustomException(ErrorCode.EMPLOYEE_NOT_FOUND);
        }
        authMapper.updatePassword(empId, passwordEncoder.encode(newPassword));
    }

    // 6. 응답 DTO 빌더
    private LoginResponseDto buildResponse(EmployeeVO employee, String accessToken) {
        return LoginResponseDto.builder()
                .accessToken(accessToken)
                .empId(employee.getEmpId())
                .loginId(employee.getLoginId())
                .empName(employee.getEmpName())
                .role(employee.getRoleCode())      // ← ROLE → roleCode 주의!
                .deptId(employee.getDeptId())
                .build();
    }
}