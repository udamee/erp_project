package com.erp.backend.notification.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

//응답 DTO
@Getter
@Setter
@NoArgsConstructor
public class NotificationResponseDTO {
    private Integer notificationId;
    private String level;
    private String receiver;
    private String content;
    private LocalDateTime dateTime;
}
