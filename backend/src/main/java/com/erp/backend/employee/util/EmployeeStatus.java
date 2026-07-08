package com.erp.backend.employee.util;

public enum EmployeeStatus {
    PENDING,     // 가입 승인 대기
    ACTIVE,      // 재직
    REJECTED,    // 가입 거절
    INACTIVE,    // 일시 비활성(휴직 등) — 복구 가능, 조회/목록에 노출
    TERMINATED   // 퇴사 — 영구, 조회/목록에서 제외, 로그인 아이디 무효화
}
