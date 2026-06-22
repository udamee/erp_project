-- =====================================================================
-- DDL : 신규 DB 전체 생성 스크립트
-- 실행 순서 : schema.sql → data.sql
-- =====================================================================

-- 재실행(초기화) 시 주석 해제 후 사용
-- DROP TABLE DEPT_ROLE_EXCEPTION;
-- DROP TABLE REFRESH_TOKEN;
-- DROP TABLE EMPLOYEE;
-- DROP TABLE DEPARTMENT;
-- DROP SEQUENCE SEQ_DEPT_ROLE_EXCEPTION;
-- DROP SEQUENCE EMP_SEQ;
-- DROP SEQUENCE SEQ_DEP_ID;

-- ---------------------------------------------------------------------
-- 1. 부서
-- ---------------------------------------------------------------------
CREATE TABLE DEPARTMENT (
    DEPT_ID      NUMBER           NOT NULL,
    DEPT_NAME    VARCHAR2(50)     NOT NULL,
    DEPT_CODE    VARCHAR2(50)     NOT NULL,
    DESCRIPTION  VARCHAR2(300),
    USE_YN       CHAR(1)          DEFAULT 'Y' NOT NULL,
    CREATED_AT   DATE             DEFAULT SYSDATE       ,

    CONSTRAINT PK_DEPARTMENT PRIMARY KEY (DEPT_ID),
    CONSTRAINT UQ_DEPT_CODE    UNIQUE (DEPT_CODE),
    CONSTRAINT CK_DEPT_USE_YN  CHECK (USE_YN IN ('Y', 'N'))
);

CREATE SEQUENCE SEQ_DEP_ID
    START WITH 1
    INCREMENT BY 1
    NOCACHE
    NOCYCLE;

-- ---------------------------------------------------------------------
-- 2. 사원
-- ---------------------------------------------------------------------
CREATE TABLE EMPLOYEE
(
    EMP_ID     NUMBER   not null,
    LOGIN_ID   VARCHAR2(50)     not null,
    PASSWORD   VARCHAR2(255)    not null,                   -- BCrypt 해시 저장
    EMP_NAME   VARCHAR2(50)     not null,
    PHONE      VARCHAR2(20),
    EMAIL      VARCHAR2(100),
    DEPT_ID    NUMBER      not null,
    ROLE_CODE  VARCHAR2(20) default 'STAFF'  not null,
    STATUS     VARCHAR2(20) default 'PENDING' not null,     -- 가입 기본값은 승인 대기
    HIRE_DATE  DATE,
    CREATED_AT DATE  default  SYSDATE,
    UPDATED_AT DATE,

    CONSTRAINT PK_EMPLOYEE      PRIMARY KEY (EMP_ID),
    CONSTRAINT UQ_EMP_LOGIN_ID  UNIQUE (LOGIN_ID),
    CONSTRAINT CK_EMP_ROLE      CHECK (ROLE_CODE IN ('STAFF', 'MANAGER', 'ADMIN')),
    CONSTRAINT CK_EMP_STATUS    CHECK (STATUS IN ('PENDING', 'ACTIVE', 'REJECTED', 'INACTIVE'))
);

CREATE SEQUENCE EMP_SEQ
    START WITH 1
    INCREMENT BY 1
    NOCACHE;

/
-- ---------------------------------------------------------------------
-- 3. 리프레시 토큰
-- ---------------------------------------------------------------------
CREATE TABLE REFRESH_TOKEN (
   JWT_ID      VARCHAR2(100)    NOT NULL,
   EMP_ID      NUMBER           NOT NULL,
   EXPIRES_AT  TIMESTAMP        NOT NULL,

   CONSTRAINT PK_REFRESH_TOKEN PRIMARY KEY (JWT_ID)
);

-- ---------------------------------------------------------------------
-- 4. 부서 × 역할 조합에 따른 예외 업무/권한 정의
-- ---------------------------------------------------------------------
CREATE TABLE DEPT_ROLE_EXCEPTION (
    EXCEPTION_ID    NUMBER          NOT NULL,
    DEPT_CODE       VARCHAR2(20)    NOT NULL,   -- 예: 'DEPT_LOG', 'DEPT_FIN'
    ROLE_CODE       VARCHAR2(20)    NOT NULL,   -- 'ROLE_STAFF' 또는 'ROLE_MANAGER'
    EXCEPTION_TITLE VARCHAR2(100)   NOT NULL,   -- 화면에 표시할 예외 직함/역할명 (예: '관리약사')
    EXCEPTION_AUTH  VARCHAR2(50)    NOT NULL,   -- 백엔드/프론트엔드 권한 체크용 코드 (예: 'EX_LOG_STOCK_ADJUST')
    DESCRIPTION     VARCHAR2(500),
    USE_YN          CHAR(1)         DEFAULT 'Y' NOT NULL,
    CREATED_AT      DATE            DEFAULT SYSDATE NOT NULL,

    CONSTRAINT PK_DEPT_ROLE_EXCEPTION PRIMARY KEY (EXCEPTION_ID),
    CONSTRAINT FK_DRE_DEPT FOREIGN KEY (DEPT_CODE) REFERENCES DEPARTMENT (DEPT_CODE),
    -- 특정 부서의 특정 역할 내에서 동일한 예외 권한 코드가 중복 등록되는 것을 방지
    CONSTRAINT UQ_DRE_COMBO UNIQUE (DEPT_CODE, ROLE_CODE, EXCEPTION_AUTH),
    CONSTRAINT CK_DRE_USE_YN CHECK (USE_YN IN ('Y', 'N'))
);

CREATE SEQUENCE DEPT_ROLE_EXCEPTION_SEQ
    START WITH 1
    INCREMENT BY 1
    NOCACHE
    NOCYCLE;

-- ---------------------------------------------------------------------
-- 5. 근태
-- ---------------------------------------------------------------------

CREATE TABLE ATTENDANCE (
    ATTENDANCE_ID  NUMBER          NOT NULL,
    EMP_ID         NUMBER          NOT NULL,
    WORK_DATE      DATE            NOT NULL,
    CHECK_IN       TIMESTAMP,
    CHECK_OUT      TIMESTAMP,
    WORK_HOURS     NUMBER(5,2),
    STATUS         VARCHAR2(20)    NOT NULL,
    MEMO           VARCHAR2(300),
    CREATED_AT     DATE            DEFAULT SYSDATE,

    CONSTRAINT PK_ATTENDANCE        PRIMARY KEY (ATTENDANCE_ID),
    CONSTRAINT FK_ATTENDANCE_EMP    FOREIGN KEY (EMP_ID) REFERENCES EMPLOYEE (EMP_ID),
    CONSTRAINT UQ_ATTENDANCE_EMP_DT UNIQUE (EMP_ID, WORK_DATE),   -- 하루 1건 제약
    CONSTRAINT CK_ATTENDANCE_STATUS CHECK (STATUS IN ('NORMAL', 'LATE', 'EARLY_LEAVE', 'ABSENT', 'LEAVE'))
);

CREATE SEQUENCE ATTENDANCE_SEQ
    START WITH 1
    INCREMENT BY 1
    NOCACHE
    NOCYCLE;

COMMIT;

