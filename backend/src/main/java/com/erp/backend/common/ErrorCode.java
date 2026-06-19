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
    ACCOUNT_PENDING(HttpStatus.FORBIDDEN, "승인 대기 중인 계정입니다."),
    ACCOUNT_REJECTED(HttpStatus.FORBIDDEN, "등록이 거절된 계정입니다."),
    ACCOUNT_INACTIVE(HttpStatus.FORBIDDEN, "비활성화된 계정입니다."),
    PASSWORD_MISMATCH(HttpStatus.BAD_REQUEST, "현재 비밀번호가 일치하지 않습니다."),
    PASSWORD_CONFIRM_MISMATCH(HttpStatus.BAD_REQUEST, "새 비밀번호와 확인이 일치하지 않습니다."),
    SAME_AS_CURRENT_PASSWORD(HttpStatus.BAD_REQUEST, "새 비밀번호가 기존 비밀번호와 동일합니다."),

    // 사원
    EMPLOYEE_NOT_FOUND(HttpStatus.NOT_FOUND, "사원을 찾을 수 없습니다."),
    EMPLOYEE_ALREADY_EXISTS(HttpStatus.BAD_REQUEST, "이미 존재하는 사원입니다."),

    // 부서
    DEPARTMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "부서를 찾을 수 없습니다."),

    // 발주 관련
    SUPPLIER_NOT_FOUND(HttpStatus.NOT_FOUND, "공급처를 찾을 수 없습니다."),
    PRODUCT_NOT_FOUND(HttpStatus.NOT_FOUND, "의약품을 찾을 수 없습니다."),
    ALREADY_PROCESSED(HttpStatus.BAD_REQUEST, "이미 처리된 발주입니다."),
    DUPLICATE_ORDER(HttpStatus.BAD_REQUEST, "이미 승인 대기 중인 발주가 있습니다."),

    PURCHASE_ORDER_NOT_FOUND(HttpStatus.NOT_FOUND, "발주를 찾을 수 없습니다."),
    INVALID_ORDER_STATUS(HttpStatus.BAD_REQUEST, "처리할 수 없는 발주 상태입니다."),
    SELF_APPROVE_NOT_ALLOWED(HttpStatus.BAD_REQUEST, "본인이 기안한 발주는 승인 할 수 없습니다."),

    ALREADY_RECEIVED(HttpStatus.BAD_REQUEST,"이미 입고 처리된 발주입니다."),
    INVALID_EXPIRY_DATE(HttpStatus.BAD_REQUEST, "유효기간이 만료된 의약품입니다."),

    // 주문
    SALES_ORDER_REQUEST_INVALID(HttpStatus.BAD_REQUEST,"주문 요청이 유효하지 않습니다"),
    SALES_ORDER_FAILED(HttpStatus.BAD_REQUEST,"주문을 요청할 수 없습니다"),
    SALES_NOT_AVAILABLE_STOCK(HttpStatus.BAD_REQUEST,"재고가 부족합니다."),
    SALES_NOT_AMOUNT_MATCHED(HttpStatus.BAD_REQUEST,"금액이 일치하지 않습니다"),
    SALES_APPROVE_FAILED(HttpStatus.BAD_REQUEST,"승인이 되지 않았습니다"),
    SALES_ALREADY_APPROVED(HttpStatus.BAD_REQUEST,"승인이 이미 되었습니다"),
    SALES_LOT_ALLOCATE_FAILED(HttpStatus.CONFLICT,"로트번호 배정 작업이 실패했습니다"),

    // 배송
    SHIPMENT_ALREADY_EXISTS(HttpStatus.CONFLICT,"이미 배정된 배송이 있습니다."),
    SHIPMENT_NOT_FOUND(HttpStatus.NOT_FOUND,"배송중인 주문이 없습니다."),
    SHIPMENT_DETAIL_FAILED(HttpStatus.BAD_REQUEST,"배송 세부내역 생성에 실패했습니다"),

    // 재고
    STOCK_MOVEMENT_FAILED(HttpStatus.BAD_REQUEST,"재고변동이력 생성에 실패했습니다.");


    private final HttpStatus status;
    private final String message;

    ErrorCode(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }
}
