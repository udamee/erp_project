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

    // 발주 관련
    SUPPLIER_NOT_FOUND(HttpStatus.NOT_FOUND, "공급처를 찾을 수 없습니다."),
    PRODUCT_NOT_FOUND(HttpStatus.NOT_FOUND, "의약품을 찾을 수 없습니다."),
    ALREADY_PROCESSED(HttpStatus.BAD_REQUEST, "이미 처리된 발주입니다."),
    DUPLICATE_ORDER(HttpStatus.BAD_REQUEST, "이미 승인 대기 중인 발주가 있습니다."),

    PURCHASE_ORDER_NOT_FOUND(HttpStatus.NOT_FOUND, "발주를 찾을 수 없습니다."),
    INVALID_ORDER_STATUS(HttpStatus.BAD_REQUEST, "처리할 수 없는 발주 상태입니다."),
    SELF_APPROVE_NOT_ALLOWED(HttpStatus.BAD_REQUEST, "본인이 기안한 발주는 승인 할 수 없습니다."),

    ALREADY_RECEIVED(HttpStatus.BAD_REQUEST,"이미 입고 처리된 발주입니다."),
    INVALID_EXPIRY_DATE(HttpStatus.BAD_REQUEST, "유효기간이 만료된 의약품입니다.")
    ;

    private final HttpStatus status;
    private final String message;

    ErrorCode(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }
}
