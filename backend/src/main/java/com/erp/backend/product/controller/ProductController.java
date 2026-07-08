package com.erp.backend.product.controller;

import com.erp.backend.common.ApiResponse;
import com.erp.backend.product.api.dto.ProductSyncDto;
import com.erp.backend.product.dto.ProductSearchRequestDto;
import com.erp.backend.product.dto.ProductSearchResponseDto;
import com.erp.backend.product.dto.ProductSyncResponseDto;
import com.erp.backend.product.service.ProductService;
import com.erp.backend.product.service.ProductSyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// 상품 조회 + 동기화(수동 실행) 컨트롤러
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/product")
public class ProductController {

    private final ProductSyncService productSyncService;
    private final ProductService productService;

    /**
     * 상품 목록 조회 API.
     * 검색 조건은 모두 선택값이며, 프론트 화면의 상품 목록/검색에 사용한다.
     */
    @GetMapping
    public ApiResponse<List<ProductSearchResponseDto>> getProducts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String isPrescription,
            @RequestParam(required = false) String storageType) {
        ProductSearchRequestDto condition = new ProductSearchRequestDto();
        condition.setKeyword(keyword);
        condition.setStatus(status);
        condition.setIsPrescription(isPrescription);
        condition.setStorageType(storageType);
        return ApiResponse.success(productService.searchProducts(condition));
    }

    /**
     * 수동 전체 상품 동기화 API.
     * Postman 또는 관리자 버튼에서 전체 API 데이터를 DB에 반영해야 할 때 호출한다.
     */
    @PostMapping("/sync/all")
    public ApiResponse<ProductSyncResponseDto> syncAllProducts() throws Exception {
        return ApiResponse.success("상품 동기화가 완료되었습니다.", productSyncService.syncAllProductsByButton());
    }

    /**
     * 기존 임시 테스트 API.
     * DB 저장 없이 insert/merge에 사용될 샘플 JSON 10건을 반환한다.
     */
    @GetMapping("/test")
    public List<ProductSyncDto> test() throws Exception {
        return productSyncService.testApi();
    }
}
