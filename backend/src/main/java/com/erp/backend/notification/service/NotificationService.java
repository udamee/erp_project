package com.erp.backend.notification.service;

import com.erp.backend.notification.dto.NotificationResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

//노티피케이션서비스 객체
@Service
@RequiredArgsConstructor
public class NotificationService {

    //메시지 발송용 템플릿
    private final SimpMessagingTemplate messagingTemplate;

    //재고부족알림 (부서만과 부서와역할 혼합)
    public void publishStockShortageAlert(String content){
        publishToDepartment("DEP_LOG",content);
        publishToDepartment("DEP_FIN","MANAGER",content);
        publishToDepartment("DEP_SAL",content);
    }

    //부서별 메세지 발신
    public void publishToDepartment(String department, String content) {
        publishToDepartment(department,null,content);
    }

    //부서에 권한까지 추가한 메세지 발신
    public void publishToDepartment(String department, String role, String content) {
        NotificationResponseDTO notification = new NotificationResponseDTO();
        notification.setReceiver(department);
        notification.setContent(content);
        notification.setDateTime(LocalDateTime.now());
        String destination;
        destination = role == null ? "/topic/departments/" + department + "/notifications"
                : "/topic/departments/" + department + "/roles/" + role + "/notifications";
        messagingTemplate.convertAndSend(destination, notification);
    }

    //전체 메세지 발신
    public void publishToAll(String content) {
        NotificationResponseDTO notification = new NotificationResponseDTO();
        notification.setReceiver("ALL");
        notification.setContent(content);
        notification.setDateTime(LocalDateTime.now());
        messagingTemplate.convertAndSend("/topic/notification", notification);
    }
}
