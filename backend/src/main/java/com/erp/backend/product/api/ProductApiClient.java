package com.erp.backend.product.api;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
@RequiredArgsConstructor
public class ProductApiClient {

    private final RestTemplate restTemplate;

    @Value("riZdzVTfDqB4/DKgm1eZ2gQloyVEDTGjvMmynX7phk469px76ZT/3dRTBQyEkay48NNmSX38yTb5PiMux5XOYw==")
    private String serviceKey;

    @Value("${api.drug.basic-url}")
    private String basicUrl;

    @Value("${api.drug.detail-url}")
    private String detailUrl;

    @Value("${api.drug.ingredient-url}")
    private String ingredientUrl;

    /**
     * API1 기본 목록 조회 기본 호출 메서드.
     * 기존 테스트 코드는 그대로 사용할 수 있고, 배치 동기화는 아래 페이지 조회 메서드를 사용한다.
     */
    public String getDrugBasicJson() {
        return getDrugBasicJson(1, 100);
    }

    /**
     * API2 상세 정보 조회 기본 호출 메서드.
     * 기존 호출부를 유지하면서 동기화 서비스는 페이지를 지정해 전체 데이터를 조회한다.
     */
    public String getDrugDetailJson() {
        return getDrugDetailJson(1, 100);
    }

    /**
     * API3 성분 정보 조회 기본 호출 메서드.
     * 기존 호출부를 유지하면서 동기화 서비스는 페이지를 지정해 전체 데이터를 조회한다.
     */
    public String getDrugIngredientJson() {
        return getDrugIngredientJson(1, 100);
    }

    /**
     * 기본 목록 API에서 한 페이지를 조회한다.
     * 월간 배치는 1페이지부터 마지막 페이지까지 이 메서드를 반복 호출해 전체 데이터를 읽는다.
     */
    public String getDrugBasicJson(int pageNo, int numOfRows) {
        return getPagedJson(basicUrl, pageNo, numOfRows);
    }

    /**
     * 상세 정보 API에서 한 페이지를 조회한다.
     * 서비스는 전체 응답을 메모리에 누적하지 않고 페이지별로 즉시 저장한다.
     */
    public String getDrugDetailJson(int pageNo, int numOfRows) {
        return getPagedJson(detailUrl, pageNo, numOfRows);
    }

    /**
     * 성분 정보 API에서 한 페이지를 조회한다.
     * 페이지 파라미터를 사용해 월간 배치를 페이지 단위로 예측 가능하게 실행한다.
     */
    public String getDrugIngredientJson(int pageNo, int numOfRows) {
        return getPagedJson(ingredientUrl, pageNo, numOfRows);
    }

    /**
     * 페이지 조회 파라미터를 포함한 공공 API URL을 생성한다.
     * 인증 방식 변경을 피하기 위해 서비스 키는 기존 구현과 같은 형식으로 유지한다.
     */
    private String getPagedJson(String baseUrl, int pageNo, int numOfRows) {
        String url =
                baseUrl
                        + "?serviceKey=" + serviceKey
                        + "&pageNo=" + pageNo
                        + "&numOfRows=" + numOfRows
                        + "&type=json";

        return restTemplate.getForObject(url, String.class);
    }
}
