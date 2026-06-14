package com.erp.backend.common;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    // 공통
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "잘못된 입력값입니다."),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "접근 권한이 없습니다."),
    NOT_FOUND(HttpStatus.NOT_FOUND, "데이터를 찾을 수 없습니다."),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 오류가 발생했습니다."),

    // 인증
    LOGIN_FAILED(HttpStatus.UNAUTHORIZED, "아이디 또는 비밀번호가 올바르지 않습니다."),
    TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "토큰이 만료되었습니다."),
    TOKEN_INVALID(HttpStatus.UNAUTHORIZED, "유효하지 않은 토큰입니다."),
    REFRESH_TOKEN_INVALID(HttpStatus.UNAUTHORIZED, "Refresh Token이 유효하지 않습니다."),

    // 사원
    EMPLOYEE_NOT_FOUND(HttpStatus.NOT_FOUND, "사원을 찾을 수 없습니다."),
    EMPLOYEE_ALREADY_EXISTS(HttpStatus.BAD_REQUEST, "이미 존재하는 사원입니다."),

    // 주문
    SALES_ORDER_FAILED(HttpStatus.BAD_REQUEST,"주문을 요청할 수 없습니다"),
    SALES_NOT_AVAILABLE_STOCK(HttpStatus.BAD_REQUEST,"재고가 부족합니다."),
    SALES_NOT_AMOUNT_MATCHED(HttpStatus.BAD_REQUEST,"금액이 일치하지 않습니다"),
    SALES_APPROVE_FAILED(HttpStatus.BAD_REQUEST,"승인이 되지 않았습니다"),
    SALES_LOT_ALLOCATE_FAILED(HttpStatus.CONFLICT,"로트번호 배정 작업이 실패했습니다"),

    SHIPMENT_ALREADY_EXISTS(HttpStatus.CONFLICT,"이미 배정된 배송이 있습니다.");

    private final HttpStatus status;
    private final String message;

    ErrorCode(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }
}
