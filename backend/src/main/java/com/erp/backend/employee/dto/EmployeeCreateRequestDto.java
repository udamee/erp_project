package com.erp.backend.employee.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class EmployeeCreateRequestDto {

    @NotBlank(message = "아이디는 필수입니다.")
    private String loginId;      // 로그인에 사용되는 직원id

    @NotBlank(message = "비밀번호는 필수입니다.")
    private String password;     // 로그인에 사용되는 pw

    @NotBlank(message = "이름은 필수입니다.")
    private String empName;      // 직원이름

    private String phone;        // 직원연락처
    private String email;        // 직원이메일

    @NotNull(message = "부서는 필수입니다.")
    private Long deptId;         // 직원부서

    private String roleCode;     // 직원 권한부여코드 (미지정 시 STAFF)
    private String status;       // 직원 재직여부 (미지정 시 ACTIVE)
    private LocalDate hireDate;  // 입사일 (미지정 시 오늘)
}
