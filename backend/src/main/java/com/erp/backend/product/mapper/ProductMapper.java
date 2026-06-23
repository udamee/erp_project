package com.erp.backend.product.mapper;

import com.erp.backend.product.api.dto.ProductSyncDto;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ProductMapper {

    /**
     * 기본 API 한 건을 PRODUCT에 병합한다.
     * 기존 행은 매핑된 PRODUCT 컬럼 값이 달라진 경우에만 갱신한다.
     */
    int mergeBasicProduct(ProductSyncDto product);

    /**
     * 기본 API 한 건을 PRODUCT_SPEC에 병합한다.
     * 상품 내부 로직을 건드리지 않고 허가/분류/EDI 메타데이터를 저장한다.
     */
    int mergeBasicProductSpec(ProductSyncDto product);

    /**
     * 상세 API 한 건을 PRODUCT에 병합한다.
     * 포장 단위와 보관 유형 컬럼만 비교해 갱신한다.
     */
    int mergeDetailProduct(ProductSyncDto product);

    /**
     * 상세 API 한 건을 PRODUCT_SPEC에 병합한다.
     * 보관 방법과 유효 기간을 상세 메타데이터로 저장한다.
     */
    int mergeDetailProductSpec(ProductSyncDto product);

    /**
     * 성분 API 한 건을 PRODUCT_SPEC에 병합한다.
     * 성분 행은 상품과 생성된 성분 스펙명을 기준으로 식별한다.
     */
    int mergeIngredientProductSpec(ProductSyncDto product);
}
