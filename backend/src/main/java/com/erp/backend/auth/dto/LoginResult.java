package com.erp.backend.auth.dto;

/**
 * 서비스 계층 인증 결과.
 * Refresh Token은 응답 바디가 아닌 HttpOnly 쿠키로 내려가므로
 * 컨트롤러가 쿠키로 설정할 수 있도록 별도로 전달한다.
 */
public record LoginResult(String refreshToken, LoginResponseDto response) {
}
