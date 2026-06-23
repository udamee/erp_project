package com.erp.backend.product.api;

import com.erp.backend.product.api.dto.DrugBasicApiDto;
import com.erp.backend.product.api.dto.DrugDetailApiDto;
import com.erp.backend.product.api.dto.DrugIngredientApiDto;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ProductApiParser {

    private final ObjectMapper objectMapper;

    /**
     * 공공 API 응답에서 body.totalCount 값을 읽는다.
     * 동기화 서비스는 이 값을 기준으로 마지막 페이지를 계산하고 전체 데이터를 조회한다.
     */
    public int parseTotalCount(String json) throws Exception {
        JsonNode root = objectMapper.readTree(json);
        return findBody(root).path("totalCount").asInt(0);
    }

    /**
     * API1 기본 목록 응답 파서.
     * 한 페이지의 응답을 DTO 목록으로 변환하며, 서비스는 다음 페이지 조회 전에 현재 페이지를 저장한다.
     */
    public List<DrugBasicApiDto> parseBasicJson(String json) throws Exception {
        List<DrugBasicApiDto> result = new ArrayList<>();
        JsonNode root = objectMapper.readTree(json);

        for (JsonNode item : findItems(root)) {
            DrugBasicApiDto dto = new DrugBasicApiDto();

            dto.setItemSeq(item.path("ITEM_SEQ").asText());
            dto.setItemName(item.path("ITEM_NAME").asText());
            dto.setEntpName(item.path("ENTP_NAME").asText());
            dto.setSpcltyPblc(item.path("SPCLTY_PBLC").asText());
            dto.setPrductType(item.path("PRDUCT_TYPE").asText());
            dto.setPrductPrmisnNo(item.path("PRDUCT_PRMISN_NO").asText());
            dto.setEdiCode(item.path("EDI_CODE").asText());

            dto.setItemEngName(item.path("ITEM_ENG_NAME").asText());
            dto.setEntpEngName(item.path("ENTP_ENG_NAME").asText());
            dto.setEntpSeq(item.path("ENTP_SEQ").asText());
            dto.setEntpNo(item.path("ENTP_NO").asText());
            dto.setItemPermitDate(item.path("ITEM_PERMIT_DATE").asText());
            dto.setInduty(item.path("INDUTY").asText());
            dto.setPermitKindCode(item.path("PERMIT_KIND_CODE").asText());
            dto.setCancelDate(item.path("CANCEL_DATE").asText());
            dto.setCancelName(item.path("CANCEL_NAME").asText());
            dto.setBizrno(item.path("BIZRNO").asText());
            dto.setBigPrdtImgUrl(item.path("BIG_PRDT_IMG_URL").asText());

            result.add(dto);
        }

        return result;
    }

    /**
     * API2 성분 정보 응답 파서.
     * 한 페이지의 성분 정보를 PRODUCT_SPEC 병합용 DTO 목록으로 변환한다.
     */
    public List<DrugIngredientApiDto> parseIngredientJson(String json) throws Exception {
        List<DrugIngredientApiDto> result = new ArrayList<>();
        JsonNode root = objectMapper.readTree(json);

        for (JsonNode item : findItems(root)) {
            DrugIngredientApiDto dto = new DrugIngredientApiDto();

            dto.setItemSeq(item.path("ITEM_SEQ").asText());
            dto.setItemIngrName(item.path("MTRAL_NM").asText());
            dto.setItemIngrCnt(item.path("TAMT_SEQ").asText());
            dto.setMainItemIngr(item.path("MAIN_INGR_ENG").asText());
            dto.setUnit(item.path("INGD_UNIT_CD").asText());
            dto.setTotalAmount(item.path("QNT").asText());

            result.add(dto);
        }

        return result;
    }

    /**
     * API3 상세 정보 응답 파서.
     * 한 페이지의 상세 정보를 PRODUCT와 PRODUCT_SPEC 갱신용 DTO 목록으로 변환한다.
     */
    public List<DrugDetailApiDto> parseDetailJson(String json) throws Exception {
        List<DrugDetailApiDto> result = new ArrayList<>();
        JsonNode root = objectMapper.readTree(json);

        for (JsonNode item : findItems(root)) {
            DrugDetailApiDto dto = new DrugDetailApiDto();

            dto.setItemSeq(item.path("ITEM_SEQ").asText());
            dto.setStorageMethod(item.path("STORAGE_METHOD").asText());
            dto.setValidTerm(item.path("VALID_TERM").asText());
            dto.setPackUnit(item.path("PACK_UNIT").asText());
            dto.setItemEngName(item.path("ITEM_ENG_NAME").asText());
            dto.setEntpEngName(item.path("ENTP_ENG_NAME").asText());
            dto.setRareDrugYn(item.path("RARE_DRUG_YN").asText());
            dto.setMaterialName(item.path("MATERIAL_NAME").asText());

            result.add(dto);
        }

        return result;
    }

    /**
     * 공공 API는 body.items 또는 response.body.items 구조로 응답할 수 있다.
     * 서비스 코드를 바꾸지 않고 두 구조를 모두 처리하기 위한 보조 메서드다.
     */
    private JsonNode findBody(JsonNode root) {
        JsonNode body = root.path("body");

        if (body.isMissingNode() || body.isNull()) {
            body = root.path("response").path("body");
        }

        return body;
    }

    /**
     * 일부 API 응답은 items를 배열로 내려주고, 일부는 { item: [...] } 형태로 내려준다.
     * 데이터가 없으면 빈 노드를 반환해 각 파서가 안전하게 빈 목록을 만들도록 한다.
     */
    private JsonNode findItems(JsonNode root) {
        JsonNode items = findBody(root).path("items");

        if (items.isObject() && items.has("item")) {
            return asArray(items.path("item"));
        }

        return asArray(items);
    }

    /**
     * 단일 item 객체를 요소 1개짜리 배열로 정규화한다.
     * API가 한 건만 반환할 때 foreach가 객체 필드를 순회하는 문제를 막는다.
     */
    private JsonNode asArray(JsonNode node) {
        if (node.isArray() || node.isMissingNode() || node.isNull()) {
            return node;
        }

        ArrayNode array = objectMapper.createArrayNode();
        array.add(node);
        return array;
    }
}
