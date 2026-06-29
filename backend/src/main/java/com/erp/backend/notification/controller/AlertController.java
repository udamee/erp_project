package com.erp.backend.notification.controller;

import com.erp.backend.common.ApiResponse;
import com.erp.backend.notification.service.AlertService;
import com.erp.backend.notification.vo.AlertVO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alert")
@RequiredArgsConstructor
public class AlertController {

    final AlertService alertService;

    @PutMapping("/{alertId}")
    public ResponseEntity<ApiResponse<Void>> readAlert(@PathVariable int alertId, @AuthenticationPrincipal long userId) {
        alertService.readMessage(alertId, userId);
        return ResponseEntity.ok(ApiResponse.success("알람 읽음처리",null));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AlertVO>>> getAllLis(@AuthenticationPrincipal long userId) {
        List<AlertVO> list = alertService.getUserAlertList(userId);
        return ResponseEntity.ok(ApiResponse.success("메세지 조회 완료",list));
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<AlertVO>>> findALl(){
        List<AlertVO> list = alertService.getAllAlerts();
        return ResponseEntity.ok(ApiResponse.success("전체 알람 조회",list));
    }


    @GetMapping("/unread")
    public ResponseEntity<ApiResponse<Integer>> countReadAlerts(@RequestParam int loginId){
        return ResponseEntity.ok(ApiResponse.success(alertService.countUnreadAlert(loginId)));
    }
}
