package com.erp.backend.notification.mapper;
import com.erp.backend.notification.vo.AlertVO;
import com.erp.backend.notification.vo.StockAlertCheckVO;
import com.erp.backend.notification.vo.NotificationItemLotVO;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;

@Mapper
public interface AlertMapper {
    StockAlertCheckVO findSafetyStockCheckByProductId(int productId);
    List<NotificationItemLotVO> findLotsForExpiryCheck();
    int existsUnreadAlert(AlertVO alertVO);
    void insertAlert(AlertVO alertVO);
}
