package com.erp.backend.auth.jwt;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        String token = resolveToken(request);

        if (StringUtils.hasText(token) && jwtTokenProvider.validateToken(token)) {

            // Access Token인지 확인 (refresh token을 access token으로 사용 못하도록 타입 검증)
            if (!"access".equals(jwtTokenProvider.getTokenType(token))) {
                filterChain.doFilter(request, response);
                return;
            }

            Long empId = jwtTokenProvider.getEmpId(token);
            String role = jwtTokenProvider.getRole(token);
            String dept = jwtTokenProvider.getDeptCode(token);

            List<GrantedAuthority> authorities = new ArrayList<>();
            authorities.add(new SimpleGrantedAuthority("ROLE_" + role));

            List<String> exAuths = jwtTokenProvider.getExceptionAuths(token); // ex 클레임 추출
            if (exAuths != null) {
                exAuths.forEach(code -> authorities.add(new SimpleGrantedAuthority(code)));
            }

            if ("ADMIN".equals(role)) {
                // ADMIN holds every department authority
                authorities.add(new SimpleGrantedAuthority("DEPT_HR"));
                authorities.add(new SimpleGrantedAuthority("DEPT_SAL"));
                authorities.add(new SimpleGrantedAuthority("DEPT_LOG"));
                authorities.add(new SimpleGrantedAuthority("DEPT_FIN"));
            } else if (StringUtils.hasText(dept)) {
                authorities.add(new SimpleGrantedAuthority(dept));
            }

            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    empId, null, authorities);
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }

    // Authorization 헤더에서 토큰 추출
    private String resolveToken(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (StringUtils.hasText(bearer) && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        return null;
    }
}