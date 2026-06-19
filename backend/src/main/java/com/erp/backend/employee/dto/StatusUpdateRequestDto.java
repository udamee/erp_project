package com.erp.backend.employee.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StatusUpdateRequestDto {

    @NotBlank
    private String status;   // ACTIVE / INACTIVE
}
