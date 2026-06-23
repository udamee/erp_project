package com.erp.backend.product.scheduler;

import com.erp.backend.product.dto.ProductSyncResponseDto;
import com.erp.backend.product.service.ProductSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProductSyncScheduler {

    private final ProductSyncService productSyncService;

    /**
     * 상품 동기화를 월간 배치로 실행한다.
     * 기본 실행 시각은 요청 트래픽을 피하기 위해 매월 1일 03시로 설정한다.
     */
    @Scheduled(
            cron = "${api.drug.sync.monthly-cron:0 0 3 1 * *}",
            zone = "${api.drug.sync.zone:Asia/Seoul}"
    )
    public void runMonthlyProductSync() {
        try {
            ProductSyncResponseDto result = productSyncService.syncProductsMonthlyBatch();

            log.info(
                    "Monthly product sync completed. basic={}, detail={}, ingredient={}",
                    result.getBasicProcessedCount(),
                    result.getDetailProcessedCount(),
                    result.getIngredientProcessedCount()
            );
        } catch (Exception e) {
            log.error("Monthly product sync failed. The application will keep running.", e);
        }
    }
}
