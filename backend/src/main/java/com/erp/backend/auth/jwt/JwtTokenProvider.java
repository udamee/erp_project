package com.erp.backend.auth.jwt;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Slf4j
@Component
public class JwtTokenProvider {

    private final SecretKey secretKey;
    private final long accessTokenExpiration;
    private final long refreshTokenExpiration;

    public JwtTokenProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-token-expiration}") long accessTokenExpiration,
            @Value("${jwt.refresh-token-expiration}") long refreshTokenExpiration) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenExpiration = accessTokenExpiration;
        this.refreshTokenExpiration = refreshTokenExpiration;
    }

    // Access Token 생성
    public String generateAccessToken(Long empId, String deptcode, String role, List<String> exAuths) {
        return Jwts.builder()
                .subject(String.valueOf(empId))
                .claim("dept", deptcode)
                .claim("role", role)
                .claim("type", "access")
                .claim("ex", exAuths)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + accessTokenExpiration))
                .signWith(secretKey)
                .compact();
    }

    // Refresh Token 생성
    public String generateRefreshToken(Long empId) {
        return Jwts.builder()
                .id(UUID.randomUUID().toString()) // Refresh Token 고유 ID (JWT ID)
                .subject(String.valueOf(empId))
                .claim("type", "refresh")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + refreshTokenExpiration))
                .signWith(secretKey)
                .compact();
    }

    // 토큰에서 사원 ID(empId) 추출
    public Long getEmpId(String token) {
        return Long.valueOf(getClaims(token).getSubject());
    }

    // 토큰에서 권한 추출
    public String getRole(String token) {
        return getClaims(token).get("role", String.class);
    }

    // 토큰에서 부서 추출
    public String getDeptCode(String token) { return getClaims(token).get("dept", String.class) ;}

    // 토큰에서 예외 권한 코드 목록 추출
    @SuppressWarnings("unchecked")
    public List<String> getExceptionAuths(String token) {
        Object ex = getClaims(token).get("ex");
        if (ex instanceof List<?> list) {
            return list.stream().map(String::valueOf).toList();
        }
        return List.of();
    }

    // 토큰 유효성 검사
    public boolean validateToken(String token) {
        try {
            getClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            log.error("Token expired: {}", e.getMessage());
        } catch (JwtException e) {
            log.error("Token invalid: {}", e.getMessage());
        }
        return false;
    }

    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    // 토큰에서 JWT ID 추출
    public String getTokenId(String token) {
        return getClaims(token).getId();
    }

    // 토큰에서 타입 추출 -> Refresh인지 Access인지 구분하기 위함
    public String getTokenType(String token) {
        return getClaims(token).get("type", String.class);
    }
}