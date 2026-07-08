package com.erp.backend.notification.service;

import com.erp.backend.notification.dto.NotificationResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;

//노티피케이션서비스 객체
@Service
@RequiredArgsConstructor
public class NotificationService {

    //메시지 발송용 템플릿
    private final SimpMessagingTemplate messagingTemplate;

    //재고부족알림 (부서만과 부서와역할 혼합)
    public void publishStockShortageAlert(int notificationId,String level,String content){
        publishToDepartment(notificationId,level,"DEPT_LOG",content);
        publishToDepartmentWithRole(notificationId,level,"DEPT_FIN","MGR",content);
        publishToDepartment(notificationId,level,"DEPT_SAL",content);
    }

    //유효기간알림
    public void publishExpiryAlert(int notificationId,String level,String content){
        publishToDepartment(notificationId,level,"DEPT_LOG",content);
        publishToDepartment(notificationId,level,"DEPT_SAL",content);
    }

    //부서별 메세지 발신
    public void publishToDepartment(int notificationId, String level, String department, String content) {
        NotificationResponseDTO notification = createNotification(notificationId,level,department,content);
        String path = buildDestination(department,null);
        sendAndLogging(path,notification);
    }

    //부서에 권한까지 추가한 메세지 발신
    public void publishToDepartmentWithRole(int notificationId, String level, String department, String role, String content) {
        NotificationResponseDTO notification = createNotification(notificationId, level,department+"/"+role,content);
        String path = buildDestination(department,role);
        sendAndLogging(path,notification);
    }

    //전체 메세지 발신
    public void publishToAll(int notificationId,String level, String content) {
        NotificationResponseDTO notification = createNotification(notificationId, level,"ALL",content);
        String path = buildDestination(null,null);
        sendAndLogging(path,notification);
    }

    //메세지 로깅
    private void sendAndLogging(String path, NotificationResponseDTO notification){
        System.out.println("SENT : " + LocalDateTime.now().toString());
        messagingTemplate.convertAndSend(path,notification);
    }

    private NotificationResponseDTO createNotification(int notificationId,String level, String receiver, String content){
        NotificationResponseDTO response = new NotificationResponseDTO();
        response.setNotificationId(notificationId);
        response.setLevel(level);
        response.setReceiver(receiver);
        response.setContent(content);
        response.setDateTime(LocalDateTime.now());
        return response;
    }

    private String buildDestination(String department, String role){
        if (StringUtils.hasText(department)&&StringUtils.hasText(role)){
            return "/topic/departments/"+department+"/roles/"+role+"/notifications";
        } else if (StringUtils.hasText(department)) {
            return "/topic/departments/"+department+"/notifications";
        } else {
            return "/topic/notifications";
        }
    }
}
