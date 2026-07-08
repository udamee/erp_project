# 부서 · 역할 권한 가이드 (@PreAuthorize 적용)

> ERP 백엔드의 인가(Authorization) 규칙과 컨트롤러에 권한을 거는 방법을 정리한 문서입니다.
> 각 팀원은 본인 담당 컨트롤러에 이 가이드대로 `@PreAuthorize`를 적용해 주세요.

---

## 1. 권한 모델 — 2축으로 생각하기

권한은 **두 개의 독립된 축**으로 구성됩니다. 두 축을 조합해서 "누가 무엇을 할 수 있는지"가 결정됩니다.

| 축 | 값 | 성격 |
|---|---|---|
| **역할(Role)** | `STAFF` < `MANAGER` < `ADMIN` | 수직 — 계층 있음 (상위가 하위 권한 포함) |
| **부서(Dept)** | `DEPT_HR` / `DEPT_SAL` / `DEPT_LOG` / `DEPT_FIN` | 수평 — 계층 없음, 서로 배타적 |

예) "인사부 Manager만 직원 승인 가능" = `역할 ≥ MANAGER` **AND** `부서 == DEPT_HR`

역할 계층은 `SecurityConfig`에 `RoleHierarchy`로 등록되어 있어
`hasRole('MANAGER')` 한 줄이면 **ADMIN도 자동 통과**합니다. (상위 역할이 하위를 포함)

```
ROLE_ADMIN > ROLE_MANAGER > ROLE_STAFF
```

### 코드 값 정의

| 구분 | 코드 | 한글명 |
|---|---|---|
| 부서 | `DEPT_HR` | 인사부 |
| 부서 | `DEPT_SAL` | 영업관리부 |
| 부서 | `DEPT_LOG` | 물류관리부 |
| 부서 | `DEPT_FIN` | 경영지원부 |
| 역할 | `STAFF` | 사원(Staff) |
| 역할 | `MANAGER` | 매니저 |
| 역할 | `ADMIN` | 시스템 관리자 |

---

## 2. 권한 정보의 흐름 (JWT → SecurityContext)

1. 로그인 시 Access Token에 `role`, `dept`(부서코드) 클레임이 담깁니다.
2. `JwtAuthFilter`가 토큰을 파싱해 SecurityContext에 두 개의 `GrantedAuthority`를 등록합니다.
   - 역할 → `ROLE_<role>`  예: `ROLE_MANAGER`
   - 부서 → `DEPT_<dept>`  예: `DEPT_HR`
3. `@PreAuthorize`가 이 권한들을 검사합니다.

> **⚠️ 선결 작업 (이게 안 되면 부서 권한이 전부 무동작):**
> `JwtAuthFilter`가 부서 권한을 등록할 때 반드시 **부서코드 값**을 넣어야 합니다.
> ```java
> List.of(
>     new SimpleGrantedAuthority("ROLE_" + role),
>     new SimpleGrantedAuthority("DEPT_" + dept)   // "dept" 리터럴 X, 변수값 O
> );
> ```
> 이 한 줄이 잘못되면 아래 모든 `hasAuthority('DEPT_xxx')`가 항상 false가 됩니다.

---

## 3. @PreAuthorize 사용법 (치트시트)

> `SecurityConfig`에 `@EnableMethodSecurity`가 이미 켜져 있어 바로 사용 가능합니다.
> 메서드 또는 클래스 위에 붙입니다. **클래스에 붙이면 그 안 모든 메서드에 공통 적용**됩니다.

| 하고 싶은 것 | 표현식 |
|---|---|
| 특정 역할 이상 | `@PreAuthorize("hasRole('MANAGER')")` |
| 특정 부서 | `@PreAuthorize("hasAuthority('DEPT_HR')")` |
| 부서 + 역할 조합 | `@PreAuthorize("hasRole('MANAGER') and hasAuthority('DEPT_HR')")` |
| 여러 역할 중 하나 | `@PreAuthorize("hasAnyRole('MANAGER','ADMIN')")` |
| ADMIN 전용 | `@PreAuthorize("hasRole('ADMIN')")` |
| 인증만 되면 OK | (어노테이션 생략 — 기본이 `authenticated`) |

### 클래스 + 메서드 조합 패턴 (권장)

부서가 컨트롤러 단위로 고정이면 **부서는 클래스에**, **역할만 메서드에** 거는 게 깔끔합니다.

```java
@RestController
@RequestMapping("/api/employees")
@PreAuthorize("hasAuthority('DEPT_HR')")          // 인사부만 진입
public class EmployeeController {

    @GetMapping                                    // Employee도 가능 → 역할 조건 없음
    public List<EmployeeResponseDto> getEmployees() { ... }

    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")            // 등록은 Manager 이상 (부서 조건은 클래스에서 상속)
    public Long createEmployee(...) { ... }
}
```

> ⚠️ 주의: 클래스에도 메서드에도 `@PreAuthorize`가 있으면 **메서드 것이 우선(덮어씀)** 입니다.
> 그래서 위 예시처럼 메서드에는 추가로 필요한 역할 조건만 적으면 됩니다.
> 두 조건을 **모두** 강제하고 싶으면 메서드에 `hasRole('MANAGER') and hasAuthority('DEPT_HR')`처럼 함께 적으세요.

### "본인만" 체크가 필요할 때 (비밀번호 변경 등)

로그인한 사용자의 `empId`는 `Authentication`의 principal에 들어 있습니다.

```java
@PatchMapping("/password")
public void changePassword(@AuthenticationPrincipal Long empId, ...) { ... }
// 또는 SecurityContextHolder.getContext().getAuthentication().getPrincipal()
```

---

## 4. 부서 · 역할 → API 매핑표

> 각 팀원은 본인 부서 표를 보고 컨트롤러에 권한을 적용하세요.
> 표의 "권장 @PreAuthorize" 열을 그대로 메서드 위에 붙이면 됩니다.

### 4-1. 인사부 (DEPT_HR)

| 역할 | API | 동작 | 권장 @PreAuthorize |
|---|---|---|---|
| Employee | `GET /api/employees` | 직원 목록 조회 | `hasAuthority('DEPT_HR')` |
| Employee | `GET /api/employees/{empId}` | 직원 상세 조회 | `hasAuthority('DEPT_HR')` |
| Employee | `PUT /api/employees/{empId}` | 직원 정보 수정 | `hasAuthority('DEPT_HR')` |
| Manager | `POST /api/employees` | 직원 등록 | `hasRole('MANAGER') and hasAuthority('DEPT_HR')` |
| Manager | `GET /api/admin/employees/pending` | 승인 대기 직원 목록 | `hasRole('MANAGER') and hasAuthority('DEPT_HR')` |
| Manager | `POST /api/admin/employees/{empId}/approve` | 직원 승인 | `hasRole('MANAGER') and hasAuthority('DEPT_HR')` |
| Manager | `POST /api/admin/employees/{empId}/reject` | 직원 반려 | `hasRole('MANAGER') and hasAuthority('DEPT_HR')` |
| Manager | `DELETE /api/employees/{empId}` | 퇴사 처리(soft delete) | `hasRole('MANAGER') and hasAuthority('DEPT_HR')` |
| 공통 | `GET /api/departments` | 부서 목록 조회(직원 배치용) | 인증만 (회원가입 폼용은 permitAll) |
| 공통 | `GET /api/departments/{deptId}` | 부서 상세 조회 | 인증만 |

### 4-2. 영업관리부 (DEPT_SAL)

| 역할 | API | 동작 |
|---|---|---|
| Employee | `POST /api/sales-order/{orderId}` | 판매 주문 등록 (REQUESTED) |
| Employee | `GET /api/sales-order/{salesId}/header` | 주문 헤더 조회 |
| Employee | `GET /api/sales-order/{salesId}/details` | 주문 상세 조회 |
| Employee | `GET /api/sales-order/products/lot-stock` | LOT별 재고 확인 |
| Employee | `GET /api/sales-order/products/available-lots` | 가용 LOT 조회 |
| Employee | `POST /api/sales/payments` | 수금 내역 등록 |
| Employee | `GET /api/sales/receivables` | 매출채권 조회 |
| Employee | `GET /api/sales/receivables/{arId}` | 매출채권 상세 |
| Manager | `GET /api/sales-order/requested/status` | 승인 대기 주문 목록 |
| Manager | `GET /api/sales-order/status` | 전체 주문 현황 |
| Manager | `PUT /api/sales-order/{orderId}` | 주문 상태 변경(승인 등) |
| Manager | `GET /api/sales/dashboard` | 영업부 종합 대시보드 |
| Manager | `GET /api/sales/payments` | 수금 현황 모니터링 |
| Manager | `GET /api/sales/invoices` | 매출 전표 목록 |

- Employee API → `hasAuthority('DEPT_SAL')`
- Manager API → `hasRole('MANAGER') and hasAuthority('DEPT_SAL')`

### 4-3. 물류관리부 (DEPT_LOG)

| 역할 | API | 동작 |
|---|---|---|
| Employee | `POST /api/purchase-orders` | 발주 기안 (PENDING_LOG) |
| Employee | `GET /api/purchase-orders` | 발주 목록 조회 |
| Employee | `GET /api/purchase-orders/{poId}` | 발주 상세 조회 |
| Employee | `GET /api/purchase-orders/suppliers` | 공급사 조회 |
| Employee | `GET /api/purchase-orders/products` | 발주 가능 품목 조회 |
| Employee | `POST /api/receivings` | 입고 등록 (LOT/유효기간) |
| Employee | `GET /api/receivings` | 입고 목록 조회 |
| Employee | `GET /api/receivings/{poId}/details` | 입고 상세(발주 대비 검수) |
| Employee | `GET /api/sales-order/check/{orderId}` | 출고 전 주문 확인 |
| Manager | `PUT /api/purchase-orders/{poId}/approve` | 소액 발주 승인 (500만 미만 전결) |
| Manager | `PUT /api/purchase-orders/{poId}/reject` | 발주 반려 |
| Manager | `GET /api/sales-order/products/lot-stock` | 재고 현황 모니터링 |

- Employee API → `hasAuthority('DEPT_LOG')`
- Manager API → `hasRole('MANAGER') and hasAuthority('DEPT_LOG')`

### 4-4. 경영지원부 (DEPT_FIN)

| 역할 | API | 동작 |
|---|---|---|
| Employee | `GET /api/sales/invoices` | 매출 전표 목록 |
| Employee | `POST /api/sales/invoices` | 매출 전표 발행 |
| Employee | `GET /api/sales/invoices/{salesInvoiceId}` | 매출 전표 상세 |
| Employee | `GET /api/sales/purchase-invoices` | 매입 전표 목록 |
| Employee | `GET /api/sales/purchase-invoices/{purchaseInvoiceId}` | 매입 전표 상세 |
| Employee | `POST /api/sales/settlements` | 손익 정산 마감 |
| Employee | `GET /api/sales/settlements` | 정산 목록 |
| Employee | `GET /api/sales/settlements/{settlementId}` | 정산 상세 |
| Manager | `PUT /api/sales-order/{orderId}` | 여신 초과 주문 승인/반려 (PENDING_CREDIT→APPROVED) |
| Manager | `PUT /api/purchase-orders/{poId}/approve` | 고액 발주 최종 승인 (PENDING_FIN→APPROVED) |
| Manager | `GET /api/sales/dashboard` | 전사 대시보드 |
| Manager | `GET /api/sales/payables` | 매입채무 조회 |
| Manager | `GET /api/sales/payables/{apId}` | 매입채무 상세 |
| Manager | `GET /api/sales/payments` | 수금 현황 |
| Manager | `GET /api/sales/payments/{paymentId}` | 수금 상세 |

- Employee API → `hasAuthority('DEPT_FIN')`
- Manager API → `hasRole('MANAGER') and hasAuthority('DEPT_FIN')`

### 4-5. 공통 (Auth) — 인증 불필요

| API | 설명 | 권한 |
|---|---|---|
| `POST /api/auth/login` | 로그인 | permitAll |
| `POST /api/auth/signup` | 회원가입 (PENDING 상태 생성) | permitAll |
| `POST /api/auth/refresh` | 토큰 갱신 | permitAll |
| `POST /api/auth/logout` | 로그아웃 | permitAll |

---

## 5. 역할 vs 부서 경계 (헷갈리는 부분 정리)

인사부 Manager의 업무와 ADMIN의 업무가 겹쳐 보이지만 **성격이 다릅니다.**

| 주체 | 담당 영역 | 예시 | 권한식 |
|---|---|---|---|
| **인사부 Manager** | 인사 *데이터* 관리 | 직원 등록 / 승인 / 퇴사 | `hasRole('MANAGER') and hasAuthority('DEPT_HR')` |
| **ADMIN** | 시스템 *계정·권한* 관리 | roleCode 부여/회수, 계정 잠금 | `hasRole('ADMIN')` (부서 무관) |

예) 역할 변경 API: `PATCH /api/admin/employees/{empId}/role` → `hasRole('ADMIN')` 전용

> **JWT 즉시성 주의:** JWT는 stateless라 ADMIN이 누군가의 역할을 바꿔도,
> 그 사람은 **재로그인 / 토큰 갱신 전까지 옛 권한**을 사용합니다.
> 현재 일정에서는 "다음 로그인 시 반영"을 기본 동작으로 둡니다.

---

## 6. 적용 체크리스트 (담당자별)

- [ ] **(공통/선결)** `JwtAuthFilter`에서 부서 권한을 `"DEPT_" + dept`로 등록 — 이거 먼저!
- [ ] `SecurityConfig`의 `/api/admin/**` 규칙 점검 — 현재 `hasAnyRole("MANAGER","ADMIN")`라 **아무 부서 매니저나** 접근 가능. 세밀한 부서 제한은 컨트롤러 `@PreAuthorize`로.
- [ ] **인사부 담당**: `EmployeeController`, `AdminEmployeeController`에 `DEPT_HR` 조건 적용
- [ ] **영업 담당**: 영업 컨트롤러에 `DEPT_SAL` 조건 적용
- [ ] **물류 담당**: 물류 컨트롤러에 `DEPT_LOG` 조건 적용
- [ ] **경영지원 담당**: 경영지원 컨트롤러에 `DEPT_FIN` 조건 적용
- [ ] 적용 후 부서/역할별 계정으로 접근 테스트 (시드 계정 활용)

---

_원본 기획: 2026-06-14 / 본 문서는 백엔드 인가 규칙의 단일 기준(Source of Truth)입니다. API 추가 시 이 표도 함께 갱신해 주세요._
