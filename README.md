# 약통 ERP — 의약품 유통 관리 시스템

> 의약품 도매·유통 업무를 통합 관리하는 ERP 시스템
> 발주·입고, 출고·재고, 인사·근태, 정산·매출을 하나의 흐름으로 연결합니다.

---

## 📌 프로젝트 소개

본 프로젝트는 의약품 유통 도매업체의 핵심 업무를 디지털화한 ERP 시스템입니다.
제약사·도매처로부터의 **사입(발주·입고)** 부터 약국·병원으로의 **출고·재고 관리**, 그리고 **정산·매출**까지 실제 의약품 유통 흐름을 반영해 설계했습니다.

### 주요 기능

- 📥 **입고·승인** : 발주 등록 → 승인/반려 → 입고 처리(로트번호·유효기간 기반 재고 생성)
- 📤 **출고·재고** : 주문 접수·승인, FEFO 재고 차감, 로트별 재고 현황, 유효기간 임박 알림
- 🗂 **기준정보** : 거래처·의약품 마스터 관리 (여신한도·보관조건·마약류 여부)
- 👥 **인사·근태** : 직원 관리, 출퇴근 기록, 근태 현황 조회
- 💰 **정산·매출** : 매입·매출 정산, 여신·미수금 관리, 손익 계산, 매출 대시보드

---

## 🛠 기술 스택

| 분류 | 기술 |
| --- | --- |
| **Frontend** | Next.js, React |
| **Backend** | Java 17, Spring Boot 3.5, MyBatis |
| **Database** | Oracle 21c XE |
| **인증** | JWT (Access / Refresh), Spring Security |
| **협업** | Notion, Discord, Jira, Git |
| **Tool** | Swagger, Postman, Figma, ERDCloud |

---

## 👨‍👩‍👧‍👦 팀원 소개

| 이름 | 담당 영역 | 주요 기능 |
| --- | --- | --- |
| 이용기 | 입고·승인 | 발주 등록·승인·반려, 입고 처리, 공통 모듈·인증 기반 |
| 박소은 | 관리자·인증·문서화 | 관리자 대시보드, 로그인·계정 관리, 문서화 |
| 김현식 | 출고·재고 | 주문·출고, FEFO 재고 차감, 재고 현황, 실시간 알림 |
| 이상영 | 거래처·약품·인사 | 거래처·의약품 마스터(공공API), 인사·근태 |
| 박소정 | 정산·매출 | 매입·매출 정산, 여신·미수금, 손익·매출 대시보드 |

---

## 🌿 Git 브랜치 전략

```
main
└── dev
    ├── feature/init-setup       (공통 모듈·인증)
    ├── feature/purchase-order   (발주·입고)
    ├── feature/inventory        (출고·재고)
    ├── feature/master           (거래처·의약품)
    ├── feature/hr               (인사·근태)
    └── feature/settlement       (정산·매출)
```

| 브랜치 | 설명 |
| --- | --- |
| `main` | 최종 배포 브랜치 |
| `dev` | 개발 통합 브랜치 |
| `feature/기능명` | 기능별 작업 브랜치 |

---

## ✍️ 커밋 메시지 규칙

```
feat     : 새로운 기능 추가
fix      : 버그 수정
docs     : 문서 수정
style    : 코드 포맷 변경 (기능 변경 없음)
refactor : 코드 리팩토링
test     : 테스트 코드 추가/수정
chore    : 빌드, 패키지 수정
```

**예시**

```
feat: 사입 발주 등록 API 구현
fix: 발주 승인 시 본인 발주 검증 오류 수정
docs: README 팀원 담당 영역 업데이트
```

> Jira 연동 시 `ERP-{번호} feat: 설명` 형식 사용

---

## 🚀 시작하는 방법

### Frontend

```bash
git clone [레포 URL]
cd frontend
npm install
npm run dev
```

> `.env.local` 에 `NEXT_PUBLIC_API_URL=http://localhost:8080` 설정 필요

### Backend

```bash
cd backend
./gradlew bootRun
```

> ⚠️ `application.yml` 의 DB 접속 정보 및 JWT 설정 필요 (팀 Discord에서 공유)
> Oracle 계정: `sql/init.sql` 실행 후 erp 계정 생성

---

## 📁 폴더 구조

```
erp-project/
├── frontend/
│   ├── app/              (App Router 페이지)
│   ├── components/       (공통 컴포넌트)
│   └── lib/             (API 클라이언트)
├── backend/
│   └── src/main/
│       ├── java/com/erp/backend/
│       │   ├── auth/        (인증·JWT)
│       │   ├── inventory/   (발주·입고)
│       │   ├── common/      (공통 모듈)
│       │   └── config/      (Security·Swagger)
│       └── resources/
│           └── mapper/      (MyBatis XML)
├── sql/                 (DDL·초기 데이터)
└── README.md
```

---

## 📄 API 문서

- Swagger : `http://localhost:8080/swagger-ui/index.html`
- Postman : 팀 워크스페이스 공유

---

## 📅 개발 일정

| 기간 | 내용 |
| --- | --- |
| 1주차 | 요구사항 분석, ERD 설계, 환경 세팅 |
| 2주차 | 공통 모듈·인증, 발주·입고, 거래처·의약품 |
| 3주차 | 출고·재고, 정산·매출, 인사·근태 |
| 4주차 | 통합 테스트, 프론트 연동, 최종 발표 |
