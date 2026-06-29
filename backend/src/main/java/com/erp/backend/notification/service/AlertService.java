package com.erp.backend.notification.service;

import com.erp.backend.notification.mapper.AlertMapper;
import com.erp.backend.notification.util.AlertLevel;
import com.erp.backend.notification.util.AlertType;
import com.erp.backend.notification.vo.AlertVO;
import com.erp.backend.notification.vo.StockAlertCheckVO;
import com.erp.backend.notification.vo.NotificationItemLotVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AlertService {

    private final AlertMapper alertMapper;
    private final NotificationService notificationService;

    @Transactional
    public void checkAfterShipment(int productId) {
        StockAlertCheckVO stock = alertMapper.findSafetyStockCheckByProductId(productId);
        if (stock == null) {
            return;
        }
        if (stock.getAvailableQty() > stock.getSafetyQty()) {
            return;
        }
        String message = makeSafetyStockAlertMessage(stock);
        createAlertIfNotExists(
                AlertLevel.CRITICAL,
                AlertType.SAFETY_STOCK_LOW,
                stock.getProductId(),
                null,
                message
        );
    }

    @Transactional
    public void checkExpiryAlerts() {
        List<NotificationItemLotVO> lots = alertMapper.findLotsForExpiryCheck();
        LocalDate today = LocalDate.now();
        for (NotificationItemLotVO lot : lots) {
            LocalDateTime expiryDate = lot.getExpiryDate();
            long daysLeft = ChronoUnit.DAYS.between(today, expiryDate.toLocalDate());
            AlertType alertType = resolveExpiryAlertType(daysLeft);
            if (alertType == null) {
                continue;
            }
            AlertLevel alertLevel = resolveAlertLevel(alertType);
            createAlertIfNotExists(alertLevel, alertType, lot.getProductId(), lot.getInventoryLotId(), makeExpiryAlertMessage(lot, daysLeft));
        }
    }

    private AlertType resolveExpiryAlertType(long daysLeft) {
        if (daysLeft < 0) {
            return AlertType.EXPIRED;
        } else if (daysLeft <= 10) {
            return AlertType.EXPIRY_10;
        } else if (daysLeft <= 30) {
            return AlertType.EXPIRY_30;
        } else if (daysLeft <= 90) {
            return AlertType.EXPIRY_90;
        }
        return null;
    }

    private AlertLevel resolveAlertLevel(AlertType alertType) {
        return switch (alertType) {
            case SYSTEM_INFO, EXPIRY_90 -> AlertLevel.INFO;
            case EXPIRY_30 -> AlertLevel.WARNING;
            case EXPIRY_10, EXPIRED, SAFETY_STOCK_LOW -> AlertLevel.CRITICAL;
        };
    }

    private String makeSafetyStockAlertMessage(StockAlertCheckVO stock) {
        return stock.getProductName()
                + "의 가용재고가 안전재고 이하입니다. "
                + "현재 가용재고: " + stock.getAvailableQty()
                + ", 안전재고: " + stock.getSafetyQty();
    }

    private String makeExpiryAlertMessage(NotificationItemLotVO lot, long daysLeft) {
        String daysMessage;
        if (daysLeft < 0) {
            daysMessage = "로트가 만료되었습니다. 유효기간: ";
        } else {
            daysMessage = "로트의 유효기간이 " + daysLeft + "일 남았습니다. 유효기간: ";
        }
        return lot.getProductName() + " / " + lot.getLotNo() + daysMessage + lot.getExpiryDate();
    }

    private void createAlertIfNotExists(
            AlertLevel alertLevel,
            AlertType alertType,
            Integer productId,
            Integer inventoryLotId,
            String message
    ) {
        AlertVO alertVO = new AlertVO();
        alertVO.setProductId(productId);
        alertVO.setInventoryLotId(inventoryLotId);
        alertVO.setAlertType(alertType.name());
        alertVO.setMessage(message);
        alertVO.setAlertLevel(alertLevel.name());
        int exists = alertMapper.existsAlert(alertVO);
        if (exists > 0) {
            return;
        }
        int alertId = alertMapper.currentAlertSeq();
        alertVO.setAlertId(alertId);
        alertMapper.insertAlert(alertVO);
        createAlertDetail(alertId, alertType);
        sendAlert(alertVO);
    }

    private void createAlertDetail(int alertId, AlertType alertType) {
        switch (alertType) {
            case SYSTEM_INFO -> {
                alertMapper.insertAlertDetail(alertId, null, null);
            }
            case SAFETY_STOCK_LOW -> {
                alertMapper.insertAlertDetail(alertId, "DEPT_LOG", null);
                alertMapper.insertAlertDetail(alertId, "DEPT_SAL", null);
                alertMapper.insertAlertDetail(alertId, "DEPT_FIN", "MGR");
            }
            case EXPIRY_90, EXPIRY_30, EXPIRY_10, EXPIRED -> {
                alertMapper.insertAlertDetail(alertId, "DEPT_LOG", null);
                alertMapper.insertAlertDetail(alertId, "DEPT_SAL", null);
            }
        }
    }

    private void sendAlert(AlertVO alertVO) {
        AlertType type = AlertType.valueOf(alertVO.getAlertType());
        switch (type) {
            case SYSTEM_INFO -> {
                notificationService.publishToAll(alertVO.getAlertId(), alertVO.getAlertLevel(), alertVO.getMessage());
            }
            case SAFETY_STOCK_LOW -> {
                notificationService.publishStockShortageAlert(alertVO.getAlertId(), alertVO.getAlertLevel(), alertVO.getMessage());
            }
            case EXPIRY_90, EXPIRY_30, EXPIRY_10, EXPIRED -> {
                notificationService.publishExpiryAlert(alertVO.getAlertId(), alertVO.getAlertLevel(), alertVO.getMessage());
                notificationService.publishToAll(alertVO.getAlertId(), alertVO.getAlertLevel(), alertVO.getMessage());
            }
        }
    }

    public void readMessage(int messageId, long loginId) {
        alertMapper.markRead(messageId,loginId);
    }

    public List<AlertVO> getUserAlertList(long currentId) {
        return alertMapper.findUserAlertList(currentId);
    }

    public int countUnreadAlert(int currentId){
        return alertMapper.countUnreadAlert(currentId);
    }

    public List<AlertVO> getAllAlerts(){
        return alertMapper.findAlertItemList();
    }



}