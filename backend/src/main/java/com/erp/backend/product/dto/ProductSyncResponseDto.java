package com.erp.backend.product.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class ProductSyncResponseDto {

    private String syncType;
    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;

    private int basicTotalCount;
    private int detailTotalCount;
    private int ingredientTotalCount;

    private int basicProcessedCount;
    private int detailProcessedCount;
    private int ingredientProcessedCount;

    public ProductSyncResponseDto(String syncType) {
        this.syncType = syncType;
        this.startedAt = LocalDateTime.now();
    }

    /**
     * 기본 API 한 페이지의 처리 건수를 누적한다.
     * 메모리 절약형 배치 전략에 맞춰 페이지 단위로 결과를 기록한다.
     */
    public void addBasicProcessedCount(int count) {
        this.basicProcessedCount += count;
    }

    /**
     * 상세 API 한 페이지의 처리 건수를 누적한다.
     * 서비스는 해당 페이지 트랜잭션이 끝난 뒤 이 메서드를 호출한다.
     */
    public void addDetailProcessedCount(int count) {
        this.detailProcessedCount += count;
    }

    /**
     * 성분 API 한 페이지의 처리 건수를 누적한다.
     * 서비스는 해당 페이지 트랜잭션이 끝난 뒤 이 메서드를 호출한다.
     */
    public void addIngredientProcessedCount(int count) {
        this.ingredientProcessedCount += count;
    }

    /**
     * 모든 API 페이지 조회와 DB 병합이 끝난 시점을 기록한다.
     */
    public void complete() {
        this.finishedAt = LocalDateTime.now();
    }
}
