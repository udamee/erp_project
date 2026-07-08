package com.erp.backend.product.service;

import com.erp.backend.product.dto.ProductSearchRequestDto;
import com.erp.backend.product.dto.ProductSearchResponseDto;
import com.erp.backend.product.mapper.ProductMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

// 상품 조회 전용 서비스. 동기화(ProductSyncService)와 책임을 분리한다.
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductMapper productMapper;

    /**
     * 검색 조건에 맞는 상품 목록을 조회한다.
     * 조건이 null로 들어와도 전체 조회가 되도록 빈 조건으로 보정한다.
     */
    @Transactional(readOnly = true)
    public List<ProductSearchResponseDto> searchProducts(ProductSearchRequestDto condition) {
        return productMapper.findProducts(
                condition != null ? condition : new ProductSearchRequestDto());
    }
}
