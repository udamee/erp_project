package com.erp.backend.employee.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResetPasswordRequestDto {

    @NotBlank(message = "새 비밀번호를 입력해주세요.")
    private String newPassword;
}
