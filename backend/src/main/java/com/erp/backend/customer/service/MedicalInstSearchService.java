package com.erp.backend.customer.service;

import com.erp.backend.customer.dto.MedicalInstSearchDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * 국립중앙의료원 응급의료정보 - 약국/병의원 검색 API 연동
 * 약국:   .../ErmctInsttInfoInqireService/getParmacyListInfoInqire
 * 병의원: .../ErmctInsttInfoInqireService/getHsptlBassInfoInqire
 *
 * 응답이 XML 이라 DocumentBuilder 로 파싱한다.
 */
@Slf4j
@Service
public class MedicalInstSearchService {

    private final WebClient webClient;

    @Value("${api.service-key}")
    private String serviceKey;

    private static final String BASE_URL = "http://apis.data.go.kr/B552657";
    private static final String PHARMACY_PATH = "/ErmctInsttInfoInqireService/getParmacyListInfoInqire";
    private static final String HOSPITAL_PATH = "/HsptlAsembySearchService/getHsptlMdcncListInfoInqire";

    public MedicalInstSearchService() {
        this.webClient = WebClient.builder().build();
    }

    // 약국 검색
    public List<MedicalInstSearchDto> searchPharmacy(String sido, String sigungu, String name) {
        return search(PHARMACY_PATH, "PHARMACY", sido, sigungu, name);
    }

    // 병의원 검색
    public List<MedicalInstSearchDto> searchHospital(String sido, String sigungu, String name) {
        return search(HOSPITAL_PATH, "HOSPITAL", sido, sigungu, name);
    }

    // 공통 검색 로직
    private List<MedicalInstSearchDto> search(String path, String type,
                                              String sido, String sigungu, String name) {
        try {
            String url = BASE_URL + path + buildQuery(sido, sigungu, name);
            log.info("[검색] 호출 URL: {}", url);

            // URI.create 로 넘겨야 WebClient 가 이미 인코딩된 URL 을 다시 인코딩하지 않는다.
            String xml = webClient.get()
                    .uri(URI.create(url))
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            log.info("[검색] XML 앞부분: {}",
                    xml != null ? xml.substring(0, Math.min(300, xml.length())) : "NULL");

            List<MedicalInstSearchDto> parsed = parseXml(xml, type);
            log.info("[검색] 파싱된 건수: {}", parsed.size());
            return parsed;

        } catch (Exception e) {
            log.error("약국·병원 검색 실패 ({}): {}", type, e.getMessage(), e);
            return new ArrayList<>();
        }
    }

    // 쿼리스트링 직접 조립 (serviceKey 는 특수문자 없는 키이므로 그대로 붙임)
    private String buildQuery(String sido, String sigungu, String name) {
        StringBuilder sb = new StringBuilder();
        sb.append("?serviceKey=").append(serviceKey);
        sb.append("&pageNo=1&numOfRows=20");
        if (sido != null && !sido.isBlank()) {
            sb.append("&Q0=").append(encode(sido));
        }
        if (sigungu != null && !sigungu.isBlank()) {
            sb.append("&Q1=").append(encode(sigungu));
        }
        if (name != null && !name.isBlank()) {
            sb.append("&QN=").append(encode(name));
        }
        return sb.toString();
    }

    private String encode(String value) {
        return java.net.URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    // XML 응답 파싱 -> DTO 리스트
    private List<MedicalInstSearchDto> parseXml(String xml, String type) throws Exception {
        List<MedicalInstSearchDto> result = new ArrayList<>();
        if (xml == null || xml.isBlank()) {
            return result;
        }

        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        DocumentBuilder builder = factory.newDocumentBuilder();
        Document doc = builder.parse(
                new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)));

        NodeList items = doc.getElementsByTagName("item");
        for (int i = 0; i < items.getLength(); i++) {
            Node node = items.item(i);
            if (node.getNodeType() == Node.ELEMENT_NODE) {
                Element el = (Element) node;
                result.add(MedicalInstSearchDto.builder()
                        .name(getTagValue(el, "dutyName"))
                        .phone(getTagValue(el, "dutyTel1"))
                        .address(getTagValue(el, "dutyAddr"))
                        .type(type)
                        .build());
            }
        }
        return result;
    }

    // 태그 값 안전하게 꺼내기
    private String getTagValue(Element el, String tag) {
        NodeList list = el.getElementsByTagName(tag);
        if (list.getLength() > 0 && list.item(0).getFirstChild() != null) {
            return list.item(0).getFirstChild().getNodeValue();
        }
        return null;
    }
}