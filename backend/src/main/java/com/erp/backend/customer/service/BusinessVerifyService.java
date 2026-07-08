package com.erp.backend.customer.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.net.URI;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/*
 * 사업자번호만으로 영업상태(계속/휴업/폐업) + 과세유형을 조회한다.
 */
@Slf4j
@Service
public class BusinessVerifyService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    @Value("${api.service-key}")
    private String serviceKey;

    private static final String NTS_STATUS_URL =
            "https://api.odcloud.kr/api/nts-businessman/v1/status";

    public BusinessVerifyService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.webClient = WebClient.builder().build();
    }

    /*
     * 사업자번호 상태조회
     * @return valid(거래가능 여부=계속사업자), bStt(상태명), taxType(과세유형) 등
     */
    public Map<String, Object> checkStatus(String businessNo) {
        Map<String, Object> result = new HashMap<>();

        String cleanNo = businessNo.replaceAll("-", "");
        Map<String, Object> requestBody = Map.of("b_no", List.of(cleanNo));

        try {
            String url = NTS_STATUS_URL + "?serviceKey=" + serviceKey;

            String response = webClient.post()
                    .uri(URI.create(url))
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            log.info("국세청 상태조회 응답: {}", response);

            JsonNode root = objectMapper.readTree(response);
            JsonNode dataNode = root.path("data");

            if (dataNode.isArray() && dataNode.size() > 0) {
                JsonNode item = dataNode.get(0);
                String bSttCd = item.path("b_stt_cd").asText();   // 01=계속, 02=휴업, 03=폐업
                String bStt = item.path("b_stt").asText();        // 상태명
                String taxType = item.path("tax_type").asText();  // 과세유형

                // b_stt 가 비어있으면 국세청에 등록 안 된 번호
                boolean registered = bStt != null && !bStt.isBlank();
                boolean active = "01".equals(bSttCd);  // 계속사업자만 거래 가능으로 판단

                result.put("valid", active);          // 거래 가능 여부
                result.put("registered", registered); // 등록된 사업자 여부
                result.put("bStt", bStt);             // "계속사업자" 등
                result.put("taxType", taxType);       // "부가가치세 일반과세자" 등
            } else {
                result.put("valid", false);
                result.put("registered", false);
                result.put("bStt", null);
                result.put("taxType", null);
            }

        } catch (Exception e) {
            log.error("사업자번호 상태조회 실패: {}", e.getMessage(), e);
            result.put("valid", false);
            result.put("registered", false);
            result.put("bStt", null);
            result.put("taxType", null);
        }

        return result;
    }
}