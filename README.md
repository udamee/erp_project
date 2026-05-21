# 사내 ERP 시스템 (Enterprise Resource Planning)

> 사내 핵심 업무를 통합 관리하는 ERP 시스템 - 발주/물류, 인사/근태, 정산/매출 관리

---

## 📌 프로젝트 소개

본 프로젝트는 사내 ERP 시스템의 핵심 기능을 구현하는 팀 프로젝트입니다.

### 주요 기능
- 📦 **발주/물류 관리** : 발주 등록, 입출고 현황, 재고 관리
- 👥 **인사/근태 관리** : 직원 정보, 근태 기록, 휴가 신청
- 💰 **정산/매출 관리** : 매출 현황, 정산 처리, 통계 조회

---

## 🛠 기술 스택 (Tech Stack)

| 분류 | 기술 |
|------|------|
| **Frontend** | React, Next.js |
| **Backend** | Java, Spring Boot |
| **Database** | Oracle |
| **협업** | Notion, Discord, Git |
| **Tool** | Swagger, Postman |

---

## 👨‍👩‍👧‍👦 팀원 소개

| 이름 | 역할 | 담당 |
|------|------|------|
| 이용기 | [추후 업데이트] | Git 레포지토리 생성 및 관리 |
| 박소은 | [추후 업데이트] | 문서화 |
| 박소정 | [추후 업데이트] | [추후 업데이트] |
| 이상영 | [추후 업데이트] | [추후 업데이트] |
| 김현식 | [추후 업데이트] | [추후 업데이트] |

---

## 🌿 Git 브랜치 전략

```
main
└── dev
    ├── feature/발주관리
    ├── feature/물류관리
    ├── feature/인사관리
    ├── feature/근태관리
    ├── feature/정산관리
    └── feature/매출관리
```

| 브랜치 | 설명 |
|--------|------|
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
feat: 직원 근태 조회 API 추가
fix: 발주 등록 시 유효성 검사 오류 수정
docs: README 브랜치 전략 업데이트
```

---

## 🚀 시작하는 방법 (Getting Started)

### Frontend
```bash
git clone [레포 URL]
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
./gradlew build
java -jar build/libs/erp.jar
```

> ⚠️ 환경변수(.env) 설정 필요 - 팀 Discord에서 공유

---

## 📁 폴더 구조

```
erp-system/
├── frontend/
│   ├── components/
│   ├── pages/
│   └── public/
├── backend/
│   ├── src/
│   │   ├── main/
│   │   └── test/
│   └── build/
├── docs/
│   └── api.postman_collection.json
└── README.md
```

---

## 📄 API 문서

- Swagger : [추후 업데이트]
- Postman Collection : `/docs/api.postman_collection.json`

---

## 📅 개발 일정

| 기간 | 내용 |
|------|------|
| [추후 업데이트] | 요구사항 분석 및 설계 |
| [추후 업데이트] | 기능 개발 |
| [추후 업데이트] | 테스트 및 디버깅 |
| [추후 업데이트] | 최종 발표 |
