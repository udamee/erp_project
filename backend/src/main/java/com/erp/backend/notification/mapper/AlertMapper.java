package com.erp.backend.notification.mapper;
import com.erp.backend.notification.vo.AlertVO;
import com.erp.backend.notification.vo.StockAlertCheckVO;
import com.erp.backend.notification.vo.NotificationItemLotVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface AlertMapper {
    int currentAlertSeq();
    StockAlertCheckVO findSafetyStockCheckByProductId(int productId);
    List<NotificationItemLotVO> findExpirySoonLotsByProductId(int productId);
    List<NotificationItemLotVO> findLotsForExpiryCheck();
    int existsAlert(AlertVO alertVO);
    void insertAlert(AlertVO alertVO);
    void insertAlertDetail(@Param("alertId")int alertId,@Param("deptCode")String deptCode,@Param("roleCode")String roleCode);
    List<AlertVO> findTargetReceiverList(@Param("deptCode") String deptCode,@Param("roleCode")String roleCode);
    List<AlertVO> findAlertItemList();

    List<AlertVO> findUserAlertList(long empId);

    void markRead(@Param("alertId") int alertId, @Param("empId") long loginId);
    void markAlertDelivered(@Param("alertId")int alertId,@Param("empId")int empId);
    List<AlertVO> findUndeliveredAlertList();
    int countUnreadAlert(int empId);
}
