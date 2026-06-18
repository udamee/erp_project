package com.erp.backend.notification.controller;

import com.erp.backend.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RequestMapping("/api/notification")
@RestController
@RequiredArgsConstructor
public class NotificationController {
    NotificationService notificationService;
    NotificationController(NotificationService notificationService){
        this.notificationService = notificationService;
    }

}
