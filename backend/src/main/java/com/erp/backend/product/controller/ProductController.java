package com.erp.backend.product.controller;

import com.erp.backend.product.api.dto.ProductSyncDto;
import com.erp.backend.product.dto.ProductSyncResponseDto;
import com.erp.backend.product.service.ProductSyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// 상품 동기화 임시 테스트 및 수동 실행 컨트롤러
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/product")
public class ProductController {

    private final ProductSyncService productSyncService;

    /**
     * 수동 전체 상품 동기화 API.
     * Postman 또는 관리자 버튼에서 전체 API 데이터를 DB에 반영해야 할 때 호출한다.
     */
    @PostMapping("/sync/all")
    public ProductSyncResponseDto syncAllProducts() throws Exception {
        return productSyncService.syncAllProductsByButton();
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
