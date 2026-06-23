package com.erp.backend.inventory.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface RecallMapper {

    /*
     * 품목기준코드(ITEM_SEQ) 목록으로 우리가 취급하는 PRODUCT를 조회.
     * 회수 목록의 itemSeq들과 매칭되는 것만 반환.
     * 반환: PRODUCT_CODE -> PRODUCT_ID 매핑용 행들
     */
    List<Map<String, Object>> findProductsByCodes(@Param("codes") List<String> codes);
}