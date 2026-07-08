package com.erp.backend.notification.util;

import com.erp.backend.notification.service.AlertService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AlertScheduler {

    private final AlertService alertService;

    @Scheduled(cron = "5 * * * * *")
    public void checkExpiryAlertsDaily() {
        alertService.checkExpiryAlerts();
    }
}