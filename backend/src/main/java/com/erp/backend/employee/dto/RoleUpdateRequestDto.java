package com.erp.backend.employee.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RoleUpdateRequestDto {

    @NotBlank
    private String roleCode;   // STAFF / MANAGER / ADMIN
}
