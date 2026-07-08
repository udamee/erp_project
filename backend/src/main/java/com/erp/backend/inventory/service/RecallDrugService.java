package com.erp.backend.inventory.service;

import com.erp.backend.inventory.dto.RecallDrugDto;
import com.erp.backend.inventory.mapper.RecallMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 식약처 의약품 회수·판매중지 정보 연동
 * https://www.data.go.kr/data/15059114/openapi.do
 *
 * getMdcinRtrvlSleStpgeList03 (의약품 회수·판매중지 목록조회, JSON)
 *
 * 외부 회수 목록을 가져와 우리 PRODUCT(product_code = 품목기준코드 ITEM_SEQ)와
 * 매칭해, 우리가 취급하는 품목 중 회수 대상을 식별한다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RecallDrugService {

    private final RecallMapper recallMapper;
    private final ObjectMapper objectMapper;

    @Value("${api.service-key}")
    private String serviceKey;

    private static final String RECALL_URL =
            "http://apis.data.go.kr/1471000/MdcinRtrvlSleStpgeInfoService04/getMdcinRtrvlSleStpgelList03";

    private final WebClient webClient = WebClient.builder().build();

    /**
     * 회수·판매중지 의약품 목록 조회 + 우리 재고 매칭
     * @param onlyInStock true면 우리가 취급하는 품목만 반환
     */
    public List<RecallDrugDto> getRecallDrugs(int pageNo, int numOfRows, boolean onlyInStock) {
        // 1) 식약처 API 호출
        List<RecallDrugDto> recalls = fetchRecallList(pageNo, numOfRows);
        if (recalls.isEmpty()) {
            return recalls;
        }

        // 2) 회수 목록의 품목기준코드(itemSeq) 추출
        List<String> codes = recalls.stream()
                .map(RecallDrugDto::getItemSeq)
                .filter(c -> c != null && !c.isBlank())
                .distinct()
                .collect(Collectors.toList());

        // 3) 우리 PRODUCT와 매칭 (product_code = itemSeq)
        Map<String, Long> codeToProductId = new java.util.HashMap<>();
        if (!codes.isEmpty()) {
            List<Map<String, Object>> products = recallMapper.findProductsByCodes(codes);
            for (Map<String, Object> p : products) {
                String code = String.valueOf(p.get("productCode"));
                Long productId = ((Number) p.get("productId")).longValue();
                codeToProductId.put(code, productId);
            }
        }

        // 4) 매칭 결과를 DTO에 반영
        List<RecallDrugDto> result = new ArrayList<>();
        for (RecallDrugDto recall : recalls) {
            Long matchedId = codeToProductId.get(recall.getItemSeq());
            RecallDrugDto enriched = RecallDrugDto.builder()
                    .productName(recall.getProductName())
                    .entrpsName(recall.getEntrpsName())
                    .recallReason(recall.getRecallReason())
                    .enforceYn(recall.getEnforceYn())
                    .commandDate(recall.getCommandDate())
                    .itemSeq(recall.getItemSeq())
                    .bizrno(recall.getBizrno())
                    .stdCd(recall.getStdCd())
                    .inStock(matchedId != null)
                    .productId(matchedId)
                    .build();

            if (!onlyInStock || enriched.isInStock()) {
                result.add(enriched);
            }
        }

        log.info("[위해의약품] 조회 {}건, 우리 취급 {}건",
                recalls.size(),
                result.stream().filter(RecallDrugDto::isInStock).count());

        return result;
    }

    // 식약처 회수 목록 API 호출 + JSON 파싱
    private List<RecallDrugDto> fetchRecallList(int pageNo, int numOfRows) {
        List<RecallDrugDto> list = new ArrayList<>();
        try {
            String url = RECALL_URL
                    + "?serviceKey=" + serviceKey.trim()
                    + "&pageNo=" + pageNo
                    + "&numOfRows=" + numOfRows
                    + "&type=json";

            log.info("[위해의약품] 호출 URL: {}", url);

            String json = webClient.get()
                    .uri(URI.create(url))
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode root = objectMapper.readTree(json);
            JsonNode items = root.path("body").path("items");

            if (items.isArray()) {
                for (JsonNode wrap : items) {
                    JsonNode item = wrap.path("item");
                    list.add(RecallDrugDto.builder()
                            .productName(text(item, "PRDUCT"))
                            .entrpsName(text(item, "ENTRPS"))
                            .recallReason(text(item, "RTRVL_RESN"))
                            .enforceYn(text(item, "ENFRC_YN"))
                            .commandDate(text(item, "RECALL_COMMAND_DATE"))
                            .itemSeq(text(item, "ITEM_SEQ"))
                            .bizrno(text(item, "BIZRNO"))
                            .stdCd(text(item, "STD_CD"))
                            .build());
                }
            }

        } catch (Exception e) {
            log.error("[위해의약품] 조회 실패: {}", e.getMessage(), e);
        }
        return list;
    }

    private String text(JsonNode node, String field) {
        JsonNode v = node.path(field);
        return v.isNull() ? null : v.asText(null);
    }
}