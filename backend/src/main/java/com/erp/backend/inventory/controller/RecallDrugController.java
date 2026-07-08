package com.erp.backend.inventory.controller;

import com.erp.backend.common.ApiResponse;
import com.erp.backend.inventory.dto.RecallDrugDto;
import com.erp.backend.inventory.service.RecallDrugService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "위해의약품", description = "식약처 의약품 회수·판매중지 정보 조회 + 우리 재고 매칭")
@RestController
@RequestMapping("/api/recall-drugs")
@RequiredArgsConstructor
public class RecallDrugController {

    private final RecallDrugService recallDrugService;

    @Operation(summary = "위해의약품 목록 조회 (회수·판매중지 + 우리 취급 여부)")
    @GetMapping
    public ResponseEntity<ApiResponse<List<RecallDrugDto>>> getRecallDrugs(
            @RequestParam(defaultValue = "1") int pageNo,
            @RequestParam(defaultValue = "50") int numOfRows,
            @RequestParam(defaultValue = "false") boolean onlyInStock) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        recallDrugService.getRecallDrugs(pageNo, numOfRows, onlyInStock)));
    }
}