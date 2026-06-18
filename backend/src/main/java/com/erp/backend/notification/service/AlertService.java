package com.erp.backend.notification.service;

import com.erp.backend.notification.mapper.AlertMapper;
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
        checkSafetyStockAlert(productId);
    }

    public void checkSafetyStockAlert(int productId) {
        StockAlertCheckVO stock = alertMapper.findSafetyStockCheckByProductId(productId);
        if (stock == null) {
            return;
        }
        if (stock.getAvailableQty() > stock.getSafetyQty()) {
            return;
        }
        String message = makeSafetyStockAlertMessage(stock);
        createAlertIfNotExists(
                stock.getProductId(),
                null,
                AlertType.SAFETY_STOCK_LOW,
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
            if(alertType==null){
                continue;
            }
            createAlertIfNotExists(lot.getProductId(),lot.getInventoryLotId(),alertType,makeExpiryAlertMessage(lot,daysLeft));
        }
    }

    private AlertType resolveExpiryAlertType(long daysLeft){
        if (daysLeft<0){
            return AlertType.EXPIRED;
        } else if (daysLeft<=10) {
            return AlertType.EXPIRY_10;
        } else if (daysLeft<=30) {
            return AlertType.EXPIRY_30;
        } else if (daysLeft<=90) {
            return AlertType.EXPIRY_90;
        }
        return null;
    }
    private String makeSafetyStockAlertMessage(StockAlertCheckVO stock) {
        return stock.getProductName()
                + "의 가용재고가 안전재고 이하입니다. "
                + "현재 가용재고: " + stock.getAvailableQty()
                + ", 안전재고: " + stock.getSafetyQty();
    }

    private String makeExpiryAlertMessage(NotificationItemLotVO lot,long daysLeft){
        String daysMessage;
        if(daysLeft<0) {
            daysMessage="로트가 만료되었습니다. 유효기간: ";
        } else {
            daysMessage="로트의 유효기간이 "+daysLeft+"일 남았습니다. 유효기간: ";
        }
        return lot.getProductName()+" / "+lot.getLotNo()+ daysMessage +lot.getExpiryDate();
    }
    private void createAlertIfNotExists(
            Integer productId,
            Integer inventoryLotId,
            AlertType alertType,
            String message
    ) {
        AlertVO alertVO = new AlertVO();
        alertVO.setProductId(productId);
        alertVO.setInventoryLotId(inventoryLotId);
        alertVO.setAlertType(alertType.name());
        alertVO.setMessage(message);

        int exists = alertMapper.existsUnreadAlert(alertVO);

          if (exists > 0) {
              return;
          }

        alertMapper.insertAlert(alertVO);
        if (alertType.name().matches("SAFETY_STOCK_LOW")){
            notificationService.publishStockShortageAlert(message);
        }
        notificationService.publishToAll(message);
    }
}