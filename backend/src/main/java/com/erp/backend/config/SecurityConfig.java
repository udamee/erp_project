package com.erp.backend.config;

import com.erp.backend.auth.jwt.JwtAuthFilter;
import com.erp.backend.auth.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.access.hierarchicalroles.RoleHierarchy;
import org.springframework.security.access.hierarchicalroles.RoleHierarchyImpl;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtTokenProvider jwtTokenProvider;

    @Value("${cors.allowed-origin}")
    private String allowedOrigin;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults())
                // 토큰 기반 무상태 인증이라 CSRF 비활성화.
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // 인증/인가 실패를 빈 응답 대신 JSON(ApiResponse)으로 내려 프론트가 처리할 수 있게 한다.
                // 미인증(토큰 없음/만료) → 401 (프론트가 토큰 재발급 시도), 권한 부족 → 403
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((req, res, e) ->
                                writeJsonError(res, 401, "인증이 필요합니다. 다시 로그인해주세요."))
                        .accessDeniedHandler((req, res, e) ->
                                writeJsonError(res, 403, "접근 권한이 없습니다.")))
                .authorizeHttpRequests(auth -> auth
                        // 비밀번호 변경은 로그인 상태에서만 허용 (permitAll 보다 먼저 선언)
                        .requestMatchers(HttpMethod.PATCH, "/api/auth/password").authenticated()
                        // 로그인·토큰 재발급은 인증 없이 허용
                        .requestMatchers("/api/auth/**").permitAll()
                        // Swagger 허용
                        .requestMatchers("/swagger-ui/**", "/api-docs/**").permitAll()
                        // 부서 조회는 회원가입 폼에서 필요하므로 인증 없이 허용
                        .requestMatchers(HttpMethod.GET, "/api/departments/**").permitAll()
                        // ADMIN, MANAGER 전용
                        .requestMatchers("/api/admin/**").hasAnyRole("MANAGER","ADMIN")
                        // 발주 승인, 반려
                        .requestMatchers(HttpMethod.PUT, "/api/purchase-orders/*/approve")
                        .hasAnyRole("MANAGER", "ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/purchase-orders/*/reject")
                        .hasAnyRole("MANAGER", "ADMIN")
                        // STORE 허용
                        .requestMatchers("/api/sales-order/**").permitAll()
                        .requestMatchers("/api/shipment/**").permitAll()
                        .requestMatchers("/api/settlement/**").permitAll()
                        // 나머지는 인증 필요
                        .anyRequest().authenticated())
                .addFilterBefore(new JwtAuthFilter(jwtTokenProvider),
                        UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // 보안 필터 단계(컨트롤러/Advice 밖)에서 거부될 때 JSON 본문을 직접 작성한다.
    private static void writeJsonError(HttpServletResponse response, int status, String message)
            throws IOException {
        response.setStatus(status);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"success\":false,\"message\":\"" + message + "\",\"data\":null}");
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    static RoleHierarchy roleHierarchy() {
        return RoleHierarchyImpl.fromHierarchy("ROLE_ADMIN > ROLE_MANAGER > ROLE_STAFF");
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        // 쿠키 전송을 위해 출처를 명시(와일드카드 불가) + 자격증명 허용
        config.setAllowedOrigins(List.of(allowedOrigin));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}