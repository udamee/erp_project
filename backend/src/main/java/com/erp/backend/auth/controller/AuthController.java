package com.erp.backend.auth.controller;

import com.erp.backend.auth.dto.ChangePasswordRequestDto;
import com.erp.backend.auth.dto.LoginRequestDto;
import com.erp.backend.auth.dto.LoginResponseDto;
import com.erp.backend.auth.dto.LoginResult;
import com.erp.backend.auth.dto.SignupRequestDto;
import com.erp.backend.auth.service.AuthService;
import com.erp.backend.common.ApiResponse;
import com.erp.backend.auth.jwt.CookieUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "인증", description = "로그인·토큰 관련 API")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final CookieUtil cookieUtil;

    @Operation(summary = "로그인")
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponseDto>> login(
            @Valid @RequestBody LoginRequestDto requestDto) {
        LoginResult result = authService.login(requestDto);
        ResponseCookie refreshCookie = cookieUtil.createRefreshTokenCookie(result.refreshToken());
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(ApiResponse.success("로그인 성공", result.response()));
    }

    @Operation(summary = "회원 가입")
    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<Void>> signup(@Valid @RequestBody SignupRequestDto dto) {
        authService.signup(dto);
        return ResponseEntity.ok(ApiResponse.success("회원 가입 성공", null));
    }

    @Operation(summary = "액세스 토큰 재발급")
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<LoginResponseDto>> refreshToken(
            @CookieValue(name = CookieUtil.REFRESH_TOKEN, required = false) String refreshToken) {
        LoginResult result = authService.refreshToken(refreshToken);
        ResponseCookie refreshCookie = cookieUtil.createRefreshTokenCookie(result.refreshToken());
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(ApiResponse.success("토큰 재발급 성공", result.response()));
    }

    @Operation(summary = "로그아웃")
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @CookieValue(name = CookieUtil.REFRESH_TOKEN, required = false) String refreshToken) {
        authService.logout(refreshToken);
        ResponseCookie clearCookie = cookieUtil.clearRefreshTokenCookie();
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearCookie.toString())
                .body(ApiResponse.success("로그아웃 성공", null));
    }

    @Operation(summary = "비밀번호 변경")
    @PatchMapping("/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal Long empId,
            @Valid @RequestBody ChangePasswordRequestDto dto) {
        authService.changePassword(empId, dto);
        return ResponseEntity.ok(ApiResponse.success("비밀번호 변경 성공", null));
    }
}
