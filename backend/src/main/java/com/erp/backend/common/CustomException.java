package com.erp.backend.common;

import lombok.Getter;

@Getter
/*
* 상태 코드와 메시지를 가진 {@link ErrorCode}를 내포
* RuntimeException을 상속받아
* 별도의 throws 선언 없이 ControllerAdvice까지 예외를 전파(Bubbling)
* */
public class CustomException extends RuntimeException{

    private final ErrorCode errorCode;

    public CustomException(ErrorCode errorCode){
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }
}
