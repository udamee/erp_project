package com.erp.backend.product.service;

import com.erp.backend.product.api.ProductApiClient;
import com.erp.backend.product.api.ProductApiParser;
import com.erp.backend.product.api.dto.DrugBasicApiDto;
import com.erp.backend.product.api.dto.DrugDetailApiDto;
import com.erp.backend.product.api.dto.DrugIngredientApiDto;
import com.erp.backend.product.api.dto.ProductSyncDto;
import com.erp.backend.product.dto.ProductSyncResponseDto;
import com.erp.backend.product.mapper.ProductMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;
import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductSyncService {

    private final ProductApiClient productApiClient;
    private final ProductApiParser productApiParser;
    private final ProductMapper productMapper;
    private final TransactionTemplate transactionTemplate;

    @Value("${api.drug.sync.num-of-rows:100}")
    private int numOfRows;

    /**
     * 수동 전체 동기화 진입점.
     * 관리자 버튼 실행을 위한 메서드이며, 모든 API 페이지를 읽고 페이지 단위로 저장한다.
     */
    public ProductSyncResponseDto syncAllProductsByButton() throws Exception {
        return runProductSync("MANUAL_BUTTON");
    }

    /**
     * 월간 배치 동기화 진입점.
     * 지속적인 API 트래픽과 불필요한 메모리 사용을 피하기 위해 스케줄러가 월 1회 호출한다.
     */
    public ProductSyncResponseDto syncProductsMonthlyBatch() throws Exception {
        return runProductSync("MONTHLY_BATCH");
    }

    /**
     * 기존 ProductController 테스트 API와의 호환성을 유지한다.
     * DB에 저장하지 않고 insert/merge에 사용될 DTO 샘플 10건만 반환한다.
     */
    public List<ProductSyncDto> testApi() throws Exception {
        return getProductInsertSample(10);
    }

    /**
     * 저장 대상 JSON 구조를 확인하기 위한 샘플 데이터를 만든다.
     * 실제 DB insert/update는 수행하지 않고 기본 API 응답을 ProductSyncDto로 변환만 한다.
     */
    public List<ProductSyncDto> getProductInsertSample(int sampleSize) throws Exception {
        int requestSize = sampleSize > 0 ? sampleSize : 10;
        String json = productApiClient.getDrugBasicJson(1, requestSize);

        return productApiParser.parseBasicJson(json)
                .stream()
                .limit(requestSize)
                .map(this::toProductSyncDto)
                .toList();
    }

    /**
     * 세 API 동기화 단계를 정해진 순서로 실행한다.
     * 상세/성분 데이터가 기존 PRODUCT 행에 연결될 수 있도록 기본 데이터를 먼저 적재한다.
     */
    private ProductSyncResponseDto runProductSync(String syncType) throws Exception {
        ProductSyncResponseDto response = new ProductSyncResponseDto(syncType);

        log.info("Product sync started. syncType={}", syncType);

        syncBasicPages(response);
        syncDetailPages(response);
        syncIngredientPages(response);

        response.complete();
        log.info(
                "Product sync finished. syncType={}, basic={}/{}, detail={}/{}, ingredient={}/{}",
                syncType,
                response.getBasicProcessedCount(),
                response.getBasicTotalCount(),
                response.getDetailProcessedCount(),
                response.getDetailTotalCount(),
                response.getIngredientProcessedCount(),
                response.getIngredientTotalCount()
        );

        return response;
    }

    /**
     * 기본 API의 모든 페이지를 조회한다.
     * 다음 원격 API 호출 전에 현재 페이지를 별도 트랜잭션으로 병합한다.
     */
    private void syncBasicPages(ProductSyncResponseDto response) throws Exception {
        int pageSize = getPageSize();
        String firstJson = productApiClient.getDrugBasicJson(1, pageSize);
        int totalCount = productApiParser.parseTotalCount(firstJson);
        List<DrugBasicApiDto> firstPage = productApiParser.parseBasicJson(firstJson);

        response.setBasicTotalCount(totalCount);
        saveBasicPage(firstPage);
        response.addBasicProcessedCount(firstPage.size());
        log.info("Product basic sync page processed. pageNo=1, rows={}", firstPage.size());

        int totalPages = calculateTotalPages(Math.max(totalCount, firstPage.size()), pageSize);

        for (int pageNo = 2; pageNo <= totalPages; pageNo++) {
            String json = productApiClient.getDrugBasicJson(pageNo, pageSize);
            List<DrugBasicApiDto> page = productApiParser.parseBasicJson(json);

            saveBasicPage(page);
            response.addBasicProcessedCount(page.size());
            log.info("Product basic sync page processed. pageNo={}, rows={}", pageNo, page.size());
        }
    }

    /**
     * 상세 API의 모든 페이지를 조회한다.
     * 상세 행은 포장 단위/보관 유형 필드와 상세 메타데이터만 갱신한다.
     */
    private void syncDetailPages(ProductSyncResponseDto response) throws Exception {
        int pageSize = getPageSize();
        String firstJson = productApiClient.getDrugDetailJson(1, pageSize);
        int totalCount = productApiParser.parseTotalCount(firstJson);
        List<DrugDetailApiDto> firstPage = productApiParser.parseDetailJson(firstJson);

        response.setDetailTotalCount(totalCount);
        saveDetailPage(firstPage);
        response.addDetailProcessedCount(firstPage.size());
        log.info("Product detail sync page processed. pageNo=1, rows={}", firstPage.size());

        int totalPages = calculateTotalPages(Math.max(totalCount, firstPage.size()), pageSize);

        for (int pageNo = 2; pageNo <= totalPages; pageNo++) {
            String json = productApiClient.getDrugDetailJson(pageNo, pageSize);
            List<DrugDetailApiDto> page = productApiParser.parseDetailJson(json);

            saveDetailPage(page);
            response.addDetailProcessedCount(page.size());
            log.info("Product detail sync page processed. pageNo={}, rows={}", pageNo, page.size());
        }
    }

    /**
     * 성분 API의 모든 페이지를 조회한다.
     * 성분 데이터는 PRODUCT_SPEC 메타데이터로 저장하며 상품 핵심 로직은 변경하지 않는다.
     */
    private void syncIngredientPages(ProductSyncResponseDto response) throws Exception {
        int pageSize = getPageSize();
        String firstJson = productApiClient.getDrugIngredientJson(1, pageSize);
        int totalCount = productApiParser.parseTotalCount(firstJson);
        List<DrugIngredientApiDto> firstPage = productApiParser.parseIngredientJson(firstJson);

        response.setIngredientTotalCount(totalCount);
        saveIngredientPage(firstPage);
        response.addIngredientProcessedCount(firstPage.size());
        log.info("Product ingredient sync page processed. pageNo=1, rows={}", firstPage.size());

        int totalPages = calculateTotalPages(Math.max(totalCount, firstPage.size()), pageSize);

        for (int pageNo = 2; pageNo <= totalPages; pageNo++) {
            String json = productApiClient.getDrugIngredientJson(pageNo, pageSize);
            List<DrugIngredientApiDto> page = productApiParser.parseIngredientJson(json);

            saveIngredientPage(page);
            response.addIngredientProcessedCount(page.size());
            log.info("Product ingredient sync page processed. pageNo={}, rows={}", pageNo, page.size());
        }
    }

    /**
     * 기본 API 한 페이지를 저장한다.
     * TransactionTemplate을 사용해 전체 월간 배치가 아니라 현재 페이지 단위로 롤백 범위를 제한한다.
     */
    private void saveBasicPage(List<DrugBasicApiDto> page) {
        if (page.isEmpty()) {
            return;
        }

        transactionTemplate.executeWithoutResult(status -> {
            for (DrugBasicApiDto source : page) {
                ProductSyncDto product = toProductSyncDto(source);
                productMapper.mergeBasicProduct(product);
                productMapper.mergeBasicProductSpec(product);
            }
        });
    }

    /**
     * 상세 API 한 페이지를 저장한다.
     * 먼저 PRODUCT를 갱신한 뒤, 긴 상세 설명은 PRODUCT_SPEC에 저장한다.
     */
    private void saveDetailPage(List<DrugDetailApiDto> page) {
        if (page.isEmpty()) {
            return;
        }

        transactionTemplate.executeWithoutResult(status -> {
            for (DrugDetailApiDto source : page) {
                ProductSyncDto product = toProductSyncDto(source);
                productMapper.mergeDetailProduct(product);
                productMapper.mergeDetailProductSpec(product);
            }
        });
    }

    /**
     * 성분 API 한 페이지를 저장한다.
     * 성분 데이터는 기존 상품에 대한 메타데이터이므로 PRODUCT_SPEC만 변경한다.
     */
    private void saveIngredientPage(List<DrugIngredientApiDto> page) {
        if (page.isEmpty()) {
            return;
        }

        transactionTemplate.executeWithoutResult(status -> {
            for (DrugIngredientApiDto source : page) {
                productMapper.mergeIngredientProductSpec(toProductSyncDto(source));
            }
        });
    }

    /**
     * 기본 API 한 행을 DB 동기화 DTO로 변환한다.
     * PRODUCT.IS_PRESCRIPTION이 CHAR(1)이므로 이 단계에서 처방 여부를 Y/N으로 정규화한다.
     */
    private ProductSyncDto toProductSyncDto(DrugBasicApiDto source) {
        ProductSyncDto product = new ProductSyncDto();
        product.setItemSeq(trimToNull(source.getItemSeq()));
        product.setItemName(trimToNull(source.getItemName()));
        product.setEntpName(trimToNull(source.getEntpName()));
        product.setSpcltyPblc(toPrescriptionYn(source.getSpcltyPblc()));
        product.setPrductType(trimToNull(source.getPrductType()));
        product.setPrductPrmisnNo(trimToNull(source.getPrductPrmisnNo()));
        product.setEdiCode(trimToNull(source.getEdiCode()));
        return product;
    }

    /**
     * 상세 API 한 행을 DB 동기화 DTO로 변환한다.
     * 보관 방법 원문은 메타데이터로 유지하고, PRODUCT.STORAGE_TYPE에 맞게 보관 유형을 정규화한다.
     */
    private ProductSyncDto toProductSyncDto(DrugDetailApiDto source) {
        ProductSyncDto product = new ProductSyncDto();
        product.setItemSeq(trimToNull(source.getItemSeq()));
        product.setPackUnit(trimToNull(source.getPackUnit()));
        product.setStorageMethod(trimToNull(source.getStorageMethod()));
        product.setStorageType(toStorageType(source.getStorageMethod()));
        product.setValidTerm(trimToNull(source.getValidTerm()));
        return product;
    }

    /**
     * 성분 API 한 행을 DB 동기화 DTO로 변환한다.
     * 성분 순번/성분명은 매퍼에서 PRODUCT_SPEC 식별값의 일부로 사용된다.
     */
    private ProductSyncDto toProductSyncDto(DrugIngredientApiDto source) {
        ProductSyncDto product = new ProductSyncDto();
        product.setItemSeq(trimToNull(source.getItemSeq()));
        product.setItemIngrName(trimToNull(source.getItemIngrName()));
        product.setItemIngrCnt(trimToNull(source.getItemIngrCnt()));
        product.setMainItemIngr(trimToNull(source.getMainItemIngr()));
        product.setTotalAmount(trimToNull(source.getTotalAmount()));
        product.setIngredientUnit(trimToNull(source.getUnit()));
        return product;
    }

    /**
     * 하나의 API 전체 데이터를 조회하기 위해 필요한 페이지 수를 계산한다.
     */
    private int calculateTotalPages(int totalCount, int pageSize) {
        if (totalCount <= 0) {
            return 0;
        }

        return (int) Math.ceil((double) totalCount / pageSize);
    }

    /**
     * 잘못된 설정값으로 인해 0건 조회 요청이 발생하지 않도록 페이지 크기를 보정한다.
     */
    private int getPageSize() {
        return numOfRows > 0 ? numOfRows : 100;
    }

    /**
     * MyBatis 바인딩 전에 공공 API의 빈 문자열을 null로 정규화한다.
     */
    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }

    /**
     * 공공 API의 처방 구분 문구를 PRODUCT.IS_PRESCRIPTION 컬럼의 Y/N 값으로 변환한다.
     */
    private String toPrescriptionYn(String value) {
        String normalized = trimToNull(value);

        if (normalized == null) {
            return "N";
        }

        String upper = normalized.toUpperCase(Locale.ROOT);

        if ("Y".equals(upper) || "YES".equals(upper) || "1".equals(upper)
                || upper.contains("SPECIAL") || normalized.contains("\uC804\uBB38")) {
            return "Y";
        }

        return "N";
    }

    /**
     * 긴 보관 방법 설명을 PRODUCT.STORAGE_TYPE에 저장할 짧은 코드로 변환한다.
     */
    private String toStorageType(String storageMethod) {
        String normalized = trimToNull(storageMethod);

        if (normalized == null) {
            return "ROOM";
        }

        String upper = normalized.toUpperCase(Locale.ROOT);

        if (normalized.contains("\uB0C9\uB3D9") || upper.contains("FREEZ")) {
            return "FROZEN";
        }

        if (normalized.contains("\uB0C9\uC7A5") || upper.contains("REFRIG") || upper.contains("COLD")) {
            return "COLD";
        }

        return "ROOM";
    }
}
