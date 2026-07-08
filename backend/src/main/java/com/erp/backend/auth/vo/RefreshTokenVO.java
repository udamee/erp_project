package com.erp.backend.auth.vo;

import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class RefreshTokenVO {

    private String jwtId;
    private Long empId;
    private LocalDateTime expiresAt;
}
