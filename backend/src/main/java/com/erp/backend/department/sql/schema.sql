-- ============================================================
--  PharmaFlow 의약품 유통 ERP - Oracle DDL
--  - 모든 PK 는 SEQUENCE 로 생성 (MyBatis <selectKey> 호환)
--  - 생성 순서: 부모 테이블 -> 자식 테이블 (FK 의존성 고려)
-- ============================================================
-- ============================================================
-- 1. SEQUENCES
-- ============================================================
CREATE SEQUENCE SEQ_DEPARTMENT
    START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE SEQUENCE SEQ_EMPLOYEE
    START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE SEQUENCE SEQ_DEPT_ROLE_EXCEPTION
    START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE SEQUENCE SEQ_ATTENDANCE
    START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE SEQUENCE SEQ_PUBLIC_API_LOG
    START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE SEQUENCE SEQ_SUPPLIER
    START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE SEQUENCE SEQ_PRODUCT
    START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE SEQUENCE SEQ_PRODUCT_SPEC
    START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE SEQUENCE SEQ_PURCHASE_ORDER
    START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE SEQUENCE SEQ_PURCHASE_ORDER_DETAIL
    START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE SEQUENCE SEQ_RECEIVING
    START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE SEQUENCE SEQ_RECEIVING_DETAIL
    START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE SEQUENCE SEQ_INVENTORY_LOT
    START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE SEQUENCE SEQ_STOCK_MOVEMENT
    START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE SEQUENCE SEQ_EXPIRY_ALERT
    START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE SEQUENCE SEQ_DISPOSAL
    START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE SEQUENCE SEQ_CUSTOMER
    START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE SEQUENCE SEQ_SALES_ORDER
    START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE SEQUENCE SEQ_SALES_ORDER_DETAIL
    START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE SEQUENCE SEQ_SHIPMENT
    START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE SEQUENCE SEQ_SHIPMENT_DETAIL
    START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE SEQUENCE SEQ_RETURN_REQUEST
    START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE SEQUENCE SEQ_PURCHASE_INVOICE
    START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE SEQUENCE SEQ_SALES_INVOICE
    START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE SEQUENCE SEQ_PAYMENT
    START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE SEQUENCE SEQ_PAYABLE_PAYMENT
    START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE SEQUENCE SEQ_ACCOUNT_PAYABLE
    START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE SEQUENCE SEQ_ACCOUNT_RECEIVABLE
    START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE SEQUENCE SEQ_SETTLEMENT
    START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE SEQUENCE SEQ_AI_REPORT
    START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE SEQUENCE SEQ_AI_QUERY_LOG
    START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE SEQUENCE SEQ_ALERT
    START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

-- ============================================================
-- 2. 조직 / 인사 / 권한
-- ============================================================
CREATE TABLE DEPARTMENT (
                            DEPT_ID NUMBER NOT NULL,
                            DEPT_NAME VARCHAR2(50) NOT NULL,
                            DESCRIPTION VARCHAR2(300),
                            USE_YN CHAR(1) DEFAULT 'Y' NOT NULL,
                            CREATED_AT DATE DEFAULT SYSDATE,
                            DEPT_CODE VARCHAR2(50) NOT NULL,
                            CONSTRAINT PK_DEPARTMENT PRIMARY KEY (DEPT_ID),
                            CONSTRAINT UK_DEPARTMENT_CODE UNIQUE (DEPT_CODE)
);

CREATE TABLE EMPLOYEE (
                          EMP_ID NUMBER NOT NULL,
                          LOGIN_ID VARCHAR2(50) NOT NULL,
                          PASSWORD VARCHAR2(255) NOT NULL,
                          EMP_NAME VARCHAR2(50) NOT NULL,
                          PHONE VARCHAR2(20),
                          EMAIL VARCHAR2(100),
                          DEPT_ID NUMBER,
                          ROLE_CODE VARCHAR2(20) NOT NULL,
                          STATUS VARCHAR2(20) NOT NULL,
                          HIRE_DATE DATE,
                          CREATED_AT DATE DEFAULT SYSDATE,
                          UPDATED_AT DATE,
                          CONSTRAINT PK_EMPLOYEE PRIMARY KEY (EMP_ID),
                          CONSTRAINT UK_EMPLOYEE_LOGIN UNIQUE (LOGIN_ID),
                          CONSTRAINT FK_EMPLOYEE_DEPT FOREIGN KEY (DEPT_ID) REFERENCES DEPARTMENT (DEPT_ID)
);

CREATE TABLE DEPT_ROLE_EXCEPTION (
                                     EXCEPTION_ID NUMBER NOT NULL,
                                     ROLE_CODE VARCHAR2(20) NOT NULL,
                                     DEPT_CODE VARCHAR2(50) NOT NULL,
                                     EXCEPTION_TITLE VARCHAR2(100) NOT NULL,
                                     EXCEPTION_AUTH VARCHAR2(50) NOT NULL,
                                     DESCRIPTION VARCHAR2(500),
                                     USE_YN CHAR(1) DEFAULT 'Y',
                                     CREATED_AT DATE DEFAULT SYSDATE NOT NULL,
                                     CONSTRAINT PK_DEPT_ROLE_EXCEPTION PRIMARY KEY (EXCEPTION_ID)
);

CREATE TABLE REFRESH_TOKEN (
                               JWT_ID VARCHAR2(36) NOT NULL,
                               EMP_ID NUMBER NOT NULL,
                               EXPIRES_AT TIMESTAMP NOT NULL,
                               CONSTRAINT PK_REFRESH_TOKEN PRIMARY KEY (JWT_ID),
                               CONSTRAINT FK_REFRESH_TOKEN_EMP FOREIGN KEY (EMP_ID) REFERENCES EMPLOYEE (EMP_ID)
);

CREATE TABLE ATTENDANCE (
                            ATTENDANCE_ID NUMBER NOT NULL,
                            EMP_ID NUMBER NOT NULL,
                            WORK_DATE DATE NOT NULL,
                            CHECK_IN TIMESTAMP,
                            CHECK_OUT TIMESTAMP,
                            WORK_HOURS DECIMAL(5, 2),
                            STATUS VARCHAR2(20) NOT NULL,
                            MEMO VARCHAR2(300),
                            CREATED_AT DATE DEFAULT SYSDATE,
                            CONSTRAINT PK_ATTENDANCE PRIMARY KEY (ATTENDANCE_ID),
                            CONSTRAINT UK_ATTENDANCE_EMP_DATE UNIQUE (EMP_ID, WORK_DATE),
                            CONSTRAINT FK_ATTENDANCE_EMP FOREIGN KEY (EMP_ID) REFERENCES EMPLOYEE (EMP_ID)
);

CREATE TABLE PUBLIC_API_LOG (
                                API_LOG_ID NUMBER NOT NULL,
                                API_NAME VARCHAR2(100) NOT NULL,
                                REQUEST_URL VARCHAR2(1000),
                                REQUEST_PARAM CLOB,
                                RESPONSE_CODE VARCHAR2(20),
                                RESPONSE_BODY CLOB,
                                CREATED_AT DATE DEFAULT SYSDATE,
                                CONSTRAINT PK_PUBLIC_API_LOG PRIMARY KEY (API_LOG_ID)
);

-- ============================================================
-- 3. 상품 마스터
-- ============================================================
CREATE TABLE PRODUCT (
                         PRODUCT_ID NUMBER NOT NULL,
                         PRODUCT_CODE VARCHAR2(50) NOT NULL,
                         PRODUCT_NAME VARCHAR2(300) NOT NULL,
                         MAKER_NAME VARCHAR2(100),
                         UNIT VARCHAR2(50),
                         STANDARD_PURCHASE_PRICE DECIMAL(12, 2) NOT NULL,
                         STANDARD_SALES_PRICE DECIMAL(12, 2) NOT NULL,
                         IS_PRESCRIPTION CHAR(1) DEFAULT 'N' NOT NULL,
                         STORAGE_TYPE VARCHAR2(50),
                         STATUS VARCHAR2(20) NOT NULL,
                         CREATED_AT DATE DEFAULT SYSDATE,
                         UPDATED_AT DATE,
                         SAFETY_QTY NUMBER DEFAULT 0 NOT NULL,
                         CONSTRAINT PK_PRODUCT PRIMARY KEY (PRODUCT_ID),
                         CONSTRAINT UK_PRODUCT_CODE UNIQUE (PRODUCT_CODE)
);

CREATE TABLE PRODUCT_SPEC (
                              SPEC_ID NUMBER NOT NULL,
                              PRODUCT_ID NUMBER NOT NULL,
                              SPEC_NAME VARCHAR2(100) NOT NULL,
                              DESCRIPTION VARCHAR2(300),
                              USE_YN CHAR(1) DEFAULT 'Y' NOT NULL,
                              CREATED_AT DATE DEFAULT SYSDATE,
                              CONSTRAINT PK_PRODUCT_SPEC PRIMARY KEY (SPEC_ID),
                              CONSTRAINT FK_PRODUCT_SPEC_PRODUCT FOREIGN KEY (PRODUCT_ID) REFERENCES PRODUCT (PRODUCT_ID)
);

-- ============================================================
-- 4. 공급처 / 매입 (발주 -> 입고)
-- ============================================================
CREATE TABLE SUPPLIER (
                          SUPPLIER_ID NUMBER NOT NULL,
                          SUPPLIER_NAME VARCHAR2(100) NOT NULL,
                          BUSINESS_NO VARCHAR2(20),
                          MANAGER_NAME VARCHAR2(50),
                          PHONE VARCHAR2(20),
                          ADDRESS VARCHAR2(300),
                          STATUS VARCHAR2(20) NOT NULL,
                          CREATED_AT DATE DEFAULT SYSDATE,
                          UPDATED_AT DATE,
                          CONSTRAINT PK_SUPPLIER PRIMARY KEY (SUPPLIER_ID)
);

CREATE TABLE PURCHASE_ORDER (
                                PO_ID NUMBER NOT NULL,
                                SUPPLIER_ID NUMBER NOT NULL,
                                REQUEST_EMP_ID NUMBER NOT NULL,
                                APPROVE_EMP_ID NUMBER,
                                PO_DATE DATE NOT NULL,
                                APPROVE_DATE DATE,
                                STATUS VARCHAR2(20) NOT NULL,
                                TOTAL_AMOUNT DECIMAL(15, 2) NOT NULL,
                                MEMO VARCHAR2(500),
                                CREATED_AT DATE DEFAULT SYSDATE,
                                UPDATED_AT DATE,
                                CONSTRAINT PK_PURCHASE_ORDER PRIMARY KEY (PO_ID),
                                CONSTRAINT FK_PO_SUPPLIER FOREIGN KEY (SUPPLIER_ID) REFERENCES SUPPLIER (SUPPLIER_ID),
                                CONSTRAINT FK_PO_REQUEST_EMP FOREIGN KEY (REQUEST_EMP_ID) REFERENCES EMPLOYEE (EMP_ID),
                                CONSTRAINT FK_PO_APPROVE_EMP FOREIGN KEY (APPROVE_EMP_ID) REFERENCES EMPLOYEE (EMP_ID)
);

CREATE TABLE PURCHASE_ORDER_DETAIL (
                                       PO_DETAIL_ID NUMBER NOT NULL,
                                       PO_ID NUMBER NOT NULL,
                                       PRODUCT_ID NUMBER NOT NULL,
                                       ORDER_QTY NUMBER NOT NULL,
                                       UNIT_PRICE DECIMAL(12, 2) NOT NULL,
                                       AMOUNT DECIMAL(15, 2) NOT NULL,
                                       CONSTRAINT PK_PURCHASE_ORDER_DETAIL PRIMARY KEY (PO_DETAIL_ID),
                                       CONSTRAINT FK_POD_PO FOREIGN KEY (PO_ID) REFERENCES PURCHASE_ORDER (PO_ID),
                                       CONSTRAINT FK_POD_PRODUCT FOREIGN KEY (PRODUCT_ID) REFERENCES PRODUCT (PRODUCT_ID)
);

CREATE TABLE RECEIVING (
                           RECEIVING_ID NUMBER NOT NULL,
                           PO_ID NUMBER NOT NULL,
                           RECEIVED_EMP_ID NUMBER NOT NULL,
                           RECEIVING_DATE DATE NOT NULL,
                           STATUS VARCHAR2(20) NOT NULL,
                           MEMO VARCHAR2(500),
                           CREATED_AT DATE DEFAULT SYSDATE,
                           CONSTRAINT PK_RECEIVING PRIMARY KEY (RECEIVING_ID),
                           CONSTRAINT FK_RECEIVING_PO FOREIGN KEY (PO_ID) REFERENCES PURCHASE_ORDER (PO_ID),
                           CONSTRAINT FK_RECEIVING_EMP FOREIGN KEY (RECEIVED_EMP_ID) REFERENCES EMPLOYEE (EMP_ID)
);

CREATE TABLE RECEIVING_DETAIL (
                                  RECEIVING_DETAIL_ID NUMBER NOT NULL,
                                  RECEIVING_ID NUMBER NOT NULL,
                                  PRODUCT_ID NUMBER NOT NULL,
                                  LOT_NO VARCHAR2(50) NOT NULL,
                                  EXPIRY_DATE DATE NOT NULL,
                                  RECEIVED_QTY NUMBER NOT NULL,
                                  UNIT_PRICE DECIMAL(12, 2) NOT NULL,
                                  CONSTRAINT PK_RECEIVING_DETAIL PRIMARY KEY (RECEIVING_DETAIL_ID),
                                  CONSTRAINT FK_RCVD_RECEIVING FOREIGN KEY (RECEIVING_ID) REFERENCES RECEIVING (RECEIVING_ID),
                                  CONSTRAINT FK_RCVD_PRODUCT FOREIGN KEY (PRODUCT_ID) REFERENCES PRODUCT (PRODUCT_ID)
);

-- ============================================================
-- 5. 재고 / 유효기간 / 폐기
-- ============================================================
CREATE TABLE INVENTORY_LOT (
                               INVENTORY_LOT_ID NUMBER NOT NULL,
                               PRODUCT_ID NUMBER NOT NULL,
                               LOT_NO VARCHAR2(50) NOT NULL,
                               EXPIRY_DATE DATE NOT NULL,
                               CURRENT_QTY NUMBER NOT NULL,
                               STATUS VARCHAR2(20) NOT NULL,
                               LOCATION VARCHAR2(50),
                               CREATED_AT DATE DEFAULT SYSDATE,
                               LAST_MODIFIED_AT DATE,
                               CONSTRAINT PK_INVENTORY_LOT PRIMARY KEY (INVENTORY_LOT_ID),
                               CONSTRAINT FK_INVLOT_PRODUCT FOREIGN KEY (PRODUCT_ID) REFERENCES PRODUCT (PRODUCT_ID)
);

CREATE TABLE STOCK_MOVEMENT (
                                MOVEMENT_ID NUMBER(10) NOT NULL,
                                INVENTORY_LOT_ID NUMBER(10) NOT NULL,
                                MOVEMENT_TYPE VARCHAR2(20) NOT NULL,
                                QTY NUMBER(10) NOT NULL,
                                BEFORE_QTY NUMBER(10) NOT NULL,
                                AFTER_QTY NUMBER(10) NOT NULL,
                                SOURCE_TYPE VARCHAR2(50),
                                SOURCE_ID NUMBER(10),
                                CREATED_BY NUMBER(10) NOT NULL,
                                CREATED_AT TIMESTAMP(6),
                                REASON VARCHAR2(100),
                                CONSTRAINT PK_STOCK_MOV PRIMARY KEY (MOVEMENT_ID),
                                CONSTRAINT FK_STOCK_MOV_INV_LOT_ID FOREIGN KEY (INVENTORY_LOT_ID) REFERENCES INVENTORY_LOT (INVENTORY_LOT_ID),
                                CONSTRAINT FK_STOCK_MOV_CREATED_BY FOREIGN KEY (CREATED_BY) REFERENCES EMPLOYEE (EMP_ID),
                                CONSTRAINT CK_STOCK_MOV_MOV_TYPE CHECK (
                                    MOVEMENT_TYPE IN ('IN', 'OUT', 'RETURN', 'DISPOSAL', 'ADJUST')
                                    ),
                                CONSTRAINT CK_STOCK_MOV_QTY CHECK (QTY > 0),
                                CONSTRAINT CK_STOCK_MOV_BEFORE_QTY CHECK (BEFORE_QTY >= 0),
                                CONSTRAINT CK_STOCK_MOV_AFTER_QTY CHECK (AFTER_QTY >= 0)
);

CREATE TABLE EXPIRY_ALERT (
                              ALERT_ID NUMBER NOT NULL,
                              INVENTORY_LOT_ID NUMBER NOT NULL,
                              ALERT_TYPE VARCHAR2(20) NOT NULL,
                              MESSAGE VARCHAR2(300) NOT NULL,
                              IS_READ CHAR(1) DEFAULT 'N' NOT NULL,
                              CREATED_AT DATE DEFAULT SYSDATE,
                              CONSTRAINT PK_EXPIRY_ALERT PRIMARY KEY (ALERT_ID),
                              CONSTRAINT FK_EXPALERT_LOT FOREIGN KEY (INVENTORY_LOT_ID) REFERENCES INVENTORY_LOT (INVENTORY_LOT_ID)
);

CREATE TABLE DISPOSAL (
                          DISPOSAL_ID NUMBER NOT NULL,
                          INVENTORY_LOT_ID NUMBER NOT NULL,
                          PRODUCT_ID NUMBER NOT NULL,
                          DISPOSAL_QTY NUMBER NOT NULL,
                          REASON VARCHAR2(500),
                          STATUS VARCHAR2(20) NOT NULL,
                          CREATED_BY NUMBER,
                          CREATED_AT DATE DEFAULT SYSDATE,
                          CONSTRAINT PK_DISPOSAL PRIMARY KEY (DISPOSAL_ID),
                          CONSTRAINT FK_DISPOSAL_LOT FOREIGN KEY (INVENTORY_LOT_ID) REFERENCES INVENTORY_LOT (INVENTORY_LOT_ID),
                          CONSTRAINT FK_DISPOSAL_PRODUCT FOREIGN KEY (PRODUCT_ID) REFERENCES PRODUCT (PRODUCT_ID),
                          CONSTRAINT FK_DISPOSAL_EMP FOREIGN KEY (CREATED_BY) REFERENCES EMPLOYEE (EMP_ID)
);

-- ============================================================
-- 6. 거래처(고객) / 판매 (수주 -> 출고 -> 반품)
-- ============================================================
CREATE TABLE CUSTOMER (
                          CUSTOMER_ID NUMBER NOT NULL,
                          CUSTOMER_NAME VARCHAR2(100) NOT NULL,
                          CUSTOMER_TYPE VARCHAR2(20) NOT NULL,
                          BUSINESS_NO VARCHAR2(20),
                          CREDIT_LIMIT DECIMAL(15, 2) NOT NULL,
                          RECEIVABLE_BALANCE DECIMAL(15, 2) NOT NULL,
                          PHONE VARCHAR2(20),
                          ADDRESS VARCHAR2(300),
                          STATUS VARCHAR2(20) NOT NULL,
                          CREATED_AT DATE DEFAULT SYSDATE,
                          UPDATED_AT DATE,
                          CONSTRAINT PK_CUSTOMER PRIMARY KEY (CUSTOMER_ID)
);

CREATE TABLE SALES_ORDER (
                             SO_ID NUMBER NOT NULL,
                             CUSTOMER_ID NUMBER NOT NULL,
                             REQUEST_EMP_ID NUMBER NOT NULL,
                             APPROVE_EMP_ID NUMBER,
                             ORDER_DATE DATE NOT NULL,
                             APPROVE_DATE DATE,
                             STATUS VARCHAR2(20) NOT NULL,
                             TOTAL_AMOUNT DECIMAL(15, 2) NOT NULL,
                             MEMO VARCHAR2(500),
                             CREATED_AT DATE DEFAULT SYSDATE,
                             UPDATED_AT DATE,
                             CONSTRAINT PK_SALES_ORDER PRIMARY KEY (SO_ID),
                             CONSTRAINT FK_SO_CUSTOMER FOREIGN KEY (CUSTOMER_ID) REFERENCES CUSTOMER (CUSTOMER_ID),
                             CONSTRAINT FK_SO_REQUEST_EMP FOREIGN KEY (REQUEST_EMP_ID) REFERENCES EMPLOYEE (EMP_ID),
                             CONSTRAINT FK_SO_APPROVE_EMP FOREIGN KEY (APPROVE_EMP_ID) REFERENCES EMPLOYEE (EMP_ID)
);

CREATE TABLE SALES_ORDER_DETAIL (
                                    SO_DETAIL_ID NUMBER NOT NULL,
                                    SO_ID NUMBER NOT NULL,
                                    PRODUCT_ID NUMBER NOT NULL,
                                    ORDER_QTY NUMBER NOT NULL,
                                    UNIT_PRICE DECIMAL(12, 2) NOT NULL,
                                    AMOUNT DECIMAL(15, 2) NOT NULL,
                                    CONSTRAINT PK_SALES_ORDER_DETAIL PRIMARY KEY (SO_DETAIL_ID),
                                    CONSTRAINT FK_SOD_SO FOREIGN KEY (SO_ID) REFERENCES SALES_ORDER (SO_ID),
                                    CONSTRAINT FK_SOD_PRODUCT FOREIGN KEY (PRODUCT_ID) REFERENCES PRODUCT (PRODUCT_ID)
);

CREATE TABLE SHIPMENT (
                          SHIPMENT_ID NUMBER NOT NULL,
                          SO_ID NUMBER NOT NULL,
                          SHIPPED_EMP_ID NUMBER NOT NULL,
                          SHIPMENT_DATE DATE NOT NULL,
                          STATUS VARCHAR2(20) NOT NULL,
                          MEMO VARCHAR2(500),
                          CREATED_AT DATE DEFAULT SYSDATE,
                          CONSTRAINT PK_SHIPMENT PRIMARY KEY (SHIPMENT_ID),
                          CONSTRAINT FK_SHIPMENT_SO FOREIGN KEY (SO_ID) REFERENCES SALES_ORDER (SO_ID),
                          CONSTRAINT FK_SHIPMENT_EMP FOREIGN KEY (SHIPPED_EMP_ID) REFERENCES EMPLOYEE (EMP_ID)
);

CREATE TABLE SHIPMENT_DETAIL (
                                 SHIPMENT_DETAIL_ID NUMBER NOT NULL,
                                 SHIPMENT_ID NUMBER NOT NULL,
                                 SO_DETAIL_ID NUMBER NOT NULL,
                                 INVENTORY_LOT_ID NUMBER NOT NULL,
                                 PRODUCT_ID NUMBER NOT NULL,
                                 SHIPPED_QTY NUMBER NOT NULL,
                                 CONSTRAINT PK_SHIPMENT_DETAIL PRIMARY KEY (SHIPMENT_DETAIL_ID),
                                 CONSTRAINT FK_SHPD_SHIPMENT FOREIGN KEY (SHIPMENT_ID) REFERENCES SHIPMENT (SHIPMENT_ID),
                                 CONSTRAINT FK_SHPD_SOD FOREIGN KEY (SO_DETAIL_ID) REFERENCES SALES_ORDER_DETAIL (SO_DETAIL_ID),
                                 CONSTRAINT FK_SHPD_LOT FOREIGN KEY (INVENTORY_LOT_ID) REFERENCES INVENTORY_LOT (INVENTORY_LOT_ID),
                                 CONSTRAINT FK_SHPD_PRODUCT FOREIGN KEY (PRODUCT_ID) REFERENCES PRODUCT (PRODUCT_ID)
);

CREATE TABLE RETURN_REQUEST (
                                RETURN_ID NUMBER NOT NULL,
                                CUSTOMER_ID NUMBER NOT NULL,
                                SO_ID NUMBER,
                                PRODUCT_ID NUMBER NOT NULL,
                                INVENTORY_LOT_ID NUMBER,
                                RETURN_QTY NUMBER NOT NULL,
                                REASON VARCHAR2(500),
                                STATUS VARCHAR2(20) NOT NULL,
                                CREATED_BY NUMBER,
                                CREATED_AT DATE DEFAULT SYSDATE,
                                CONSTRAINT PK_RETURN_REQUEST PRIMARY KEY (RETURN_ID),
                                CONSTRAINT FK_RTN_CUSTOMER FOREIGN KEY (CUSTOMER_ID) REFERENCES CUSTOMER (CUSTOMER_ID),
                                CONSTRAINT FK_RTN_SO FOREIGN KEY (SO_ID) REFERENCES SALES_ORDER (SO_ID),
                                CONSTRAINT FK_RTN_PRODUCT FOREIGN KEY (PRODUCT_ID) REFERENCES PRODUCT (PRODUCT_ID),
                                CONSTRAINT FK_RTN_LOT FOREIGN KEY (INVENTORY_LOT_ID) REFERENCES INVENTORY_LOT (INVENTORY_LOT_ID),
                                CONSTRAINT FK_RTN_EMP FOREIGN KEY (CREATED_BY) REFERENCES EMPLOYEE (EMP_ID)
);

-- ============================================================
-- 7. 회계 / 정산 (전표 / 미지급 / 미수금 / 수금 / 손익)
-- ============================================================
CREATE TABLE PURCHASE_INVOICE (
                                  PURCHASE_INVOICE_ID NUMBER NOT NULL,
                                  PO_ID NUMBER NOT NULL,
                                  SUPPLIER_ID NUMBER NOT NULL,
                                  ISSUE_DATE DATE NOT NULL,
                                  TOTAL_AMOUNT DECIMAL(15, 2) NOT NULL,
                                  STATUS VARCHAR2(20) NOT NULL,
                                  CREATED_AT DATE DEFAULT SYSDATE,
                                  CONSTRAINT PK_PURCHASE_INVOICE PRIMARY KEY (PURCHASE_INVOICE_ID),
                                  CONSTRAINT FK_PINV_PO FOREIGN KEY (PO_ID) REFERENCES PURCHASE_ORDER (PO_ID),
                                  CONSTRAINT FK_PINV_SUPPLIER FOREIGN KEY (SUPPLIER_ID) REFERENCES SUPPLIER (SUPPLIER_ID)
);

CREATE TABLE SALES_INVOICE (
                               SALES_INVOICE_ID NUMBER NOT NULL,
                               SO_ID NUMBER NOT NULL,
                               CUSTOMER_ID NUMBER NOT NULL,
                               ISSUE_DATE DATE NOT NULL,
                               TOTAL_AMOUNT DECIMAL(15, 2) NOT NULL,
                               STATUS VARCHAR2(20) NOT NULL,
                               CREATED_AT DATE DEFAULT SYSDATE,
                               CONSTRAINT PK_SALES_INVOICE PRIMARY KEY (SALES_INVOICE_ID),
                               CONSTRAINT FK_SINV_SO FOREIGN KEY (SO_ID) REFERENCES SALES_ORDER (SO_ID),
                               CONSTRAINT FK_SINV_CUSTOMER FOREIGN KEY (CUSTOMER_ID) REFERENCES CUSTOMER (CUSTOMER_ID)
);

CREATE TABLE PAYMENT (
                         PAYMENT_ID NUMBER NOT NULL,
                         AR_ID NUMBER NOT NULL,
                         CUSTOMER_ID NUMBER NOT NULL,
                         PAYMENT_DATE DATE NOT NULL,
                         PAYMENT_AMOUNT DECIMAL(15, 2) NOT NULL,
                         PAYMENT_TYPE VARCHAR2(20) NOT NULL,
                         CREATED_BY NUMBER NOT NULL,
                         CREATED_AT DATE DEFAULT SYSDATE,
                         CONSTRAINT PK_PAYMENT PRIMARY KEY (PAYMENT_ID),
                         CONSTRAINT FK_PAY_CUSTOMER FOREIGN KEY (CUSTOMER_ID) REFERENCES CUSTOMER (CUSTOMER_ID),
                         CONSTRAINT FK_PAY_EMP FOREIGN KEY (CREATED_BY) REFERENCES EMPLOYEE (EMP_ID)
);

CREATE TABLE ACCOUNT_PAYABLE (
                                 AP_ID NUMBER NOT NULL,
                                 SUPPLIER_ID NUMBER NOT NULL,
                                 PURCHASE_INVOICE_ID NUMBER NOT NULL,
                                 TOTAL_AMOUNT DECIMAL(15, 2) NOT NULL,
                                 PAID_AMOUNT DECIMAL(15, 2) NOT NULL,
                                 REMAIN_AMOUNT DECIMAL(15, 2) NOT NULL,
                                 DUE_DATE DATE,
                                 STATUS VARCHAR2(20) NOT NULL,
                                 CREATED_AT DATE DEFAULT SYSDATE,
                                 CONSTRAINT PK_ACCOUNT_PAYABLE PRIMARY KEY (AP_ID),
                                 CONSTRAINT FK_AP_SUPPLIER FOREIGN KEY (SUPPLIER_ID) REFERENCES SUPPLIER (SUPPLIER_ID),
                                 CONSTRAINT FK_AP_PINV FOREIGN KEY (PURCHASE_INVOICE_ID) REFERENCES PURCHASE_INVOICE (PURCHASE_INVOICE_ID)
);

CREATE TABLE ACCOUNT_RECEIVABLE (
                                    AR_ID NUMBER NOT NULL,
                                    CUSTOMER_ID NUMBER NOT NULL,
                                    SALES_INVOICE_ID NUMBER NOT NULL,
                                    TOTAL_AMOUNT DECIMAL(15, 2) NOT NULL,
                                    PAID_AMOUNT DECIMAL(15, 2) NOT NULL,
                                    REMAIN_AMOUNT DECIMAL(15, 2) NOT NULL,
                                    DUE_DATE DATE,
                                    STATUS VARCHAR2(20) NOT NULL,
                                    CREATED_AT DATE DEFAULT SYSDATE,
                                    CONSTRAINT PK_ACCOUNT_RECEIVABLE PRIMARY KEY (AR_ID),
                                    CONSTRAINT FK_AR_CUSTOMER FOREIGN KEY (CUSTOMER_ID) REFERENCES CUSTOMER (CUSTOMER_ID),
                                    CONSTRAINT FK_AR_SINV FOREIGN KEY (SALES_INVOICE_ID) REFERENCES SALES_INVOICE (SALES_INVOICE_ID)
);

-- PAYMENT.AR_ID 의 FK (ACCOUNT_RECEIVABLE 생성 이후 추가)
ALTER TABLE PAYMENT
    ADD CONSTRAINT FK_PAY_AR FOREIGN KEY (AR_ID) REFERENCES ACCOUNT_RECEIVABLE (AR_ID);

CREATE TABLE SETTLEMENT (
                            SETTLEMENT_ID NUMBER NOT NULL,
                            START_DATE DATE NOT NULL,
                            END_DATE DATE NOT NULL,
                            TOTAL_PURCHASE DECIMAL(15, 2) NOT NULL,
                            TOTAL_SALES DECIMAL(15, 2) NOT NULL,
                            TOTAL_RECEIVABLE DECIMAL(15, 2) NOT NULL,
                            TOTAL_PAYABLE DECIMAL(15, 2) NOT NULL,
                            GROSS_PROFIT DECIMAL(15, 2) NOT NULL,
                            PROFIT_RATE DECIMAL(5, 2) NOT NULL,
                            CREATED_BY NUMBER,
                            CREATED_AT DATE DEFAULT SYSDATE,
                            CONSTRAINT PK_SETTLEMENT PRIMARY KEY (SETTLEMENT_ID),
                            CONSTRAINT FK_SETTLEMENT_EMP FOREIGN KEY (CREATED_BY) REFERENCES EMPLOYEE (EMP_ID)
);

-- ============================================================
-- 8. AI 리포트 / 쿼리 로그
-- ============================================================
CREATE TABLE AI_REPORT (
                           REPORT_ID NUMBER NOT NULL,
                           REPORT_TYPE VARCHAR2(30) NOT NULL,
                           TITLE VARCHAR2(200) NOT NULL,
                           CONTENT CLOB,
                           CREATED_BY NUMBER,
                           CREATED_AT DATE DEFAULT SYSDATE NOT NULL,
                           CONSTRAINT PK_AI_REPORT PRIMARY KEY (REPORT_ID),
                           CONSTRAINT FK_AIREPORT_EMP FOREIGN KEY (CREATED_BY) REFERENCES EMPLOYEE (EMP_ID)
);

CREATE TABLE AI_QUERY_LOG (
                              QUERY_ID NUMBER NOT NULL,
                              EMP_ID NUMBER NOT NULL,
                              USER_QUESTION CLOB,
                              GENERATED_SQL CLOB,
                              RESULT_SUMMARY CLOB,
                              CREATED_AT DATE DEFAULT SYSDATE,
                              CONSTRAINT PK_AI_QUERY_LOG PRIMARY KEY (QUERY_ID),
                              CONSTRAINT FK_AIQUERY_EMP FOREIGN KEY (EMP_ID) REFERENCES EMPLOYEE (EMP_ID)
);

-- ============================================================
-- 9. 시스템 알람
-- ============================================================
CREATE TABLE ALERT (
                              ALERT_ID NUMBER NOT NULL,
                              PRODUCT_ID NUMBER,
                              INVENTORY_LOT_ID NUMBER,
                              ALERT_TYPE VARCHAR2(30) NOT NULL,
                              MESSAGE VARCHAR2(500) NOT NULL,
                              CREATED_AT TIMESTAMP(6) DEFAULT SYSTIMESTAMP,
                              ALERT_LEVEL VARCHAR2(30),
                              CONSTRAINT PK_ALERT PRIMARY KEY (ALERT_ID),
                              CONSTRAINT FK_ALERT_PRODUCT FOREIGN KEY (PRODUCT_ID) REFERENCES PRODUCT (PRODUCT_ID),
                              CONSTRAINT FK_ALERT_INVENTORY_LOT FOREIGN KEY (INVENTORY_LOT_ID) REFERENCES INVENTORY_LOT (INVENTORY_LOT_ID)
);

CREATE TABLE ALERT_DETAIL (
                                     ALERT_ID NUMBER NOT NULL,
                                     DEPT_ID NUMBER NOT NULL,
                                     EMP_ID NUMBER NOT NULL,
                                     ROLE_CODE VARCHAR2(20),
                                     IS_READ CHAR DEFAULT 'N' NOT NULL CONSTRAINT CK_ALERT_DETAIL_IS_READ CHECK (IS_READ IN ('Y', 'N')),
                                     IS_DELIVERED CHAR DEFAULT 'N' NOT NULL CONSTRAINT CK_ALERT_DETAIL_IS_DELIVERED CHECK (IS_DELIVERED IN ('Y', 'N')),
                                     CONSTRAINT ALERT_DETAIL_ALERT_ALERT_ID_FK FOREIGN KEY (ALERT_ID) REFERENCES ALERT (ALERT_ID),
                                     CONSTRAINT ALERT_DETAIL_DEPARTMENT_DEPT_ID_FK FOREIGN KEY (DEPT_ID) REFERENCES DEPARTMENT (DEPT_ID),
                                     CONSTRAINT ALERT_DETAIL_EMPLOYEE_EMP_ID_FK FOREIGN KEY (EMP_ID) REFERENCES EMPLOYEE (EMP_ID),
                                     CONSTRAINT ALERT_DETAIL_PK PRIMARY KEY (ALERT_ID, EMP_ID)
);
