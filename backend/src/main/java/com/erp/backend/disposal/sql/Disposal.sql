-- ============================================================
-- 폐기 관리 테이블 전체 재생성
-- DISPOSAL        : 폐기 요청 헤더
-- DISPOSAL_DETAIL : 폐기 대상 로트별 상세
-- ============================================================


-- ============================================================
-- 1. 기존 객체 삭제
-- 존재하지 않아도 다음 작업이 진행되도록 예외 처리
-- ============================================================

BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE SYSTEM.DISPOSAL_DETAIL CASCADE CONSTRAINTS';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE != -942 THEN
            RAISE;
        END IF;
END;
/

BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE SYSTEM.DISPOSAL CASCADE CONSTRAINTS';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE != -942 THEN
            RAISE;
        END IF;
END;
/

BEGIN
    EXECUTE IMMEDIATE 'DROP SEQUENCE SYSTEM.SEQ_DISPOSAL_DETAIL';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE != -2289 THEN
            RAISE;
        END IF;
END;
/

BEGIN
    EXECUTE IMMEDIATE 'DROP SEQUENCE SYSTEM.SEQ_DISPOSAL';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE != -2289 THEN
            RAISE;
        END IF;
END;
/


-- ============================================================
-- 2. 폐기 헤더 시퀀스
-- ============================================================

CREATE SEQUENCE SYSTEM.SEQ_DISPOSAL
    START WITH 1
    INCREMENT BY 1
    NOMAXVALUE
    NOCYCLE
    NOCACHE
/


-- ============================================================
-- 3. 폐기 상세 시퀀스
-- ============================================================

CREATE SEQUENCE SYSTEM.SEQ_DISPOSAL_DETAIL
    START WITH 1
    INCREMENT BY 1
    NOMAXVALUE
    NOCYCLE
    NOCACHE
/


-- ============================================================
-- 4. 폐기 헤더 테이블
-- ============================================================

CREATE TABLE SYSTEM.DISPOSAL
(
    DISPOSAL_ID   NUMBER(10)                        NOT NULL
        CONSTRAINT PK_DISP
            PRIMARY KEY,

    REASON        VARCHAR2(500),

    STATUS        VARCHAR2(20) DEFAULT 'REQUESTED'  NOT NULL
        CONSTRAINT CK_DISP_STATUS
            CHECK (
                STATUS IN (
                           'REQUESTED',
                           'APPROVED',
                           'COMPLETED',
                           'REJECTED'
                    )
                ),

    CREATED_BY    NUMBER(10)                        NOT NULL
        CONSTRAINT FK_DISP_CREATED_BY
            REFERENCES SYSTEM.EMPLOYEE (EMP_ID),

    CREATED_AT    TIMESTAMP(6) DEFAULT SYSTIMESTAMP NOT NULL,

    APPROVED_BY   NUMBER(10)
        CONSTRAINT FK_DISP_APPROVED_BY
            REFERENCES SYSTEM.EMPLOYEE (EMP_ID),

    APPROVED_AT   TIMESTAMP(6),

    COMPLETED_AT  TIMESTAMP(6),

    REJECT_REASON VARCHAR2(500)
)
/


-- ============================================================
-- 5. 폐기 상세 테이블
-- ============================================================

CREATE TABLE SYSTEM.DISPOSAL_DETAIL
(
    DISPOSAL_DETAIL_ID NUMBER(10) NOT NULL
        CONSTRAINT PK_DISP_DTL
            PRIMARY KEY,

    DISPOSAL_ID        NUMBER(10) NOT NULL
        CONSTRAINT FK_DISP_DTL_DISP_ID
            REFERENCES SYSTEM.DISPOSAL (DISPOSAL_ID),

    INVENTORY_LOT_ID   NUMBER(10) NOT NULL
        CONSTRAINT FK_DISP_DTL_INV_LOT_ID
            REFERENCES SYSTEM.INVENTORY_LOT (INVENTORY_LOT_ID),

    PRODUCT_ID         NUMBER(10) NOT NULL
        CONSTRAINT FK_DISP_DTL_PROD_ID
            REFERENCES SYSTEM.PRODUCT (PRODUCT_ID),

    DISPOSAL_QTY       NUMBER(10) NOT NULL
        CONSTRAINT CK_DISP_DTL_QTY
            CHECK (DISPOSAL_QTY > 0),

    REASON             VARCHAR2(500)
)
/


-- ============================================================
-- 6. 폐기 헤더 테이블 코멘트
-- ============================================================

COMMENT ON TABLE SYSTEM.DISPOSAL IS
    '유효기간 만료, 파손 등의 사유로 발생한 의약품 폐기 요청을 관리하는 헤더 테이블'
/

COMMENT ON COLUMN SYSTEM.DISPOSAL.DISPOSAL_ID IS
    '폐기 요청을 식별하는 기본키 값이 저장된다.'
/

COMMENT ON COLUMN SYSTEM.DISPOSAL.REASON IS
    '폐기 요청 전체에 적용되는 폐기 사유가 저장된다.'
/

COMMENT ON COLUMN SYSTEM.DISPOSAL.STATUS IS
    '폐기 처리 상태가 저장된다. REQUESTED, APPROVED, COMPLETED, REJECTED 값을 사용한다.'
/

COMMENT ON COLUMN SYSTEM.DISPOSAL.CREATED_BY IS
    '폐기 요청을 등록한 직원을 참조하는 EMPLOYEE 테이블의 키 값이 저장된다.'
/

COMMENT ON COLUMN SYSTEM.DISPOSAL.CREATED_AT IS
    '폐기 요청 생성일시가 저장된다.'
/

COMMENT ON COLUMN SYSTEM.DISPOSAL.APPROVED_BY IS
    '폐기 요청을 승인한 직원을 참조하는 EMPLOYEE 테이블의 키 값이 저장된다.'
/

COMMENT ON COLUMN SYSTEM.DISPOSAL.APPROVED_AT IS
    '폐기 요청 승인일시가 저장된다.'
/

COMMENT ON COLUMN SYSTEM.DISPOSAL.COMPLETED_AT IS
    '재고 차감 및 실제 폐기 처리가 완료된 일시가 저장된다.'
/

COMMENT ON COLUMN SYSTEM.DISPOSAL.REJECT_REASON IS
    '폐기 요청이 반려된 경우 반려 사유가 저장된다.'
/


-- ============================================================
-- 7. 폐기 상세 테이블 코멘트
-- ============================================================

COMMENT ON TABLE SYSTEM.DISPOSAL_DETAIL IS
    '폐기 요청에 포함된 재고 로트별 상품, 수량 및 폐기 사유를 관리하는 상세 테이블'
/

COMMENT ON COLUMN SYSTEM.DISPOSAL_DETAIL.DISPOSAL_DETAIL_ID IS
    '폐기 상세 데이터를 식별하는 기본키 값이 저장된다.'
/

COMMENT ON COLUMN SYSTEM.DISPOSAL_DETAIL.DISPOSAL_ID IS
    '폐기 요청 헤더를 참조하는 DISPOSAL 테이블의 키 값이 저장된다.'
/

COMMENT ON COLUMN SYSTEM.DISPOSAL_DETAIL.INVENTORY_LOT_ID IS
    '폐기 대상 재고 로트를 참조하는 INVENTORY_LOT 테이블의 키 값이 저장된다.'
/

COMMENT ON COLUMN SYSTEM.DISPOSAL_DETAIL.PRODUCT_ID IS
    '폐기 대상 상품을 참조하는 PRODUCT 테이블의 키 값이 저장된다.'
/

COMMENT ON COLUMN SYSTEM.DISPOSAL_DETAIL.DISPOSAL_QTY IS
    '해당 재고 로트에서 폐기할 수량이 저장된다.'
/

COMMENT ON COLUMN SYSTEM.DISPOSAL_DETAIL.REASON IS
    '해당 폐기 상세 품목에 적용되는 폐기 사유가 저장된다.'
/


-- ============================================================
-- 8. 폐기 헤더 인덱스
-- ============================================================

CREATE INDEX SYSTEM.IX_DISP_CREATED_BY
    ON SYSTEM.DISPOSAL (CREATED_BY)
/

CREATE INDEX SYSTEM.IX_DISP_APPROVED_BY
    ON SYSTEM.DISPOSAL (APPROVED_BY)
/

CREATE INDEX SYSTEM.IX_DISP_STATUS
    ON SYSTEM.DISPOSAL (STATUS)
/

CREATE INDEX SYSTEM.IX_DISP_CREATED_AT
    ON SYSTEM.DISPOSAL (CREATED_AT)
/


-- ============================================================
-- 9. 폐기 상세 인덱스
-- ============================================================

CREATE INDEX SYSTEM.IX_DISP_DTL_DISP_ID
    ON SYSTEM.DISPOSAL_DETAIL (DISPOSAL_ID)
/

CREATE INDEX SYSTEM.IX_DISP_DTL_INV_LOT_ID
    ON SYSTEM.DISPOSAL_DETAIL (INVENTORY_LOT_ID)
/

CREATE INDEX SYSTEM.IX_DISP_DTL_PROD_ID
    ON SYSTEM.DISPOSAL_DETAIL (PRODUCT_ID)
/