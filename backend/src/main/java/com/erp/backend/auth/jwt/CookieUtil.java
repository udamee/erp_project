package com.erp.backend.auth.jwt;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
public class CookieUtil {

    public static final String REFRESH_TOKEN = "refreshToken";

    // Refresh Token 쿠키는 인증 관련 요청에만 전송되도록 경로 제한
    private static final String COOKIE_PATH = "/api/auth";

    @Value("${jwt.refresh-token-expiration}")
    private long refreshTokenExpiration; // ms

    @Value("${cookie.secure:false}")
    private boolean secure;

    @Value("${cookie.same-site:Lax}")
    private String sameSite;

    // Refresh Token을 담은 HttpOnly 쿠키 생성
    public ResponseCookie createRefreshTokenCookie(String token) {
        return baseCookie(token)
                .maxAge(Duration.ofMillis(refreshTokenExpiration))
                .build();
    }

    // 로그아웃 시 쿠키 즉시 만료
    public ResponseCookie clearRefreshTokenCookie() {
        return baseCookie("")
                .maxAge(0)
                .build();
    }

    private ResponseCookie.ResponseCookieBuilder baseCookie(String value) {
        return ResponseCookie.from(REFRESH_TOKEN, value)
                .httpOnly(true)
                .secure(secure)
                .sameSite(sameSite)
                .path(COOKIE_PATH);
    }
}
