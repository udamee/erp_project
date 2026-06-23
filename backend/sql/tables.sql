CREATE TABLE "손익 계산 정산 테이블" (
                                "SETTLEMENT_ID"	INTEGER		NOT NULL,
                                "START_DATE"	DATE		NOT NULL,
                                "END_DATE"	DATE		NOT NULL,
                                "TOTAL_PURCHASE"	DECIMAL(15,2)	DEFAULT 0	NOT NULL,
                                "TOTAL_SALES"	DECIMAL(15,2)	DEFAULT 0	NOT NULL,
                                "TOTAL_RECEIVABLE"	DECIMAL(15,2)	DEFAULT 0	NOT NULL,
                                "TOTAL_PAYABLE"	DECIMAL(15,2)	DEFAULT 0	NOT NULL,
                                "GROSS_PROFIT"	DECIMAL(15,2)	DEFAULT 0	NOT NULL,
                                "PROFIT_RATE"	DECIMAL(5,2)	DEFAULT 0	NOT NULL,
                                "CREATED_BY"	INTEGER		NOT NULL,
                                "CREATED_AT"	DATE		NULL
);

CREATE TABLE "거래처별 미수금 관리 테이블" (
                                   "AR_ID"	INTEGER		NOT NULL,
                                   "CUSTOMER_ID"	INTEGER		NOT NULL,
                                   "SALES_INVOICE_ID"	INTEGER		NOT NULL,
                                   "TOTAL_AMOUNT"	DECIMAL(15,2)		NOT NULL,
                                   "PAID_AMOUNT"	DECIMAL(15,2)	DEFAULT 0	NOT NULL,
                                   "REMAIN_AMOUNT"	DECIMAL(15,2)		NOT NULL,
                                   "DUE_DATE"	DATE		NULL,
                                   "STATUS"	VARCHAR(20)	DEFAULT 'UNPAID'	NOT NULL,
                                   "CREATED_AT"	DATE		NULL
);

CREATE TABLE "입고 상세 테이블" (
                             "RECEIVING_DETAIL_ID"	INTEGER		NOT NULL,
                             "RECEIVING_ID"	INTEGER		NOT NULL,
                             "PRODUCT_ID"	INTEGER		NOT NULL,
                             "LOT_NO"	VARCHAR(50)		NOT NULL,
                             "EXPIRY_DATE"	DATE		NOT NULL,
                             "RECEIVED_QTY"	INTEGER		NOT NULL,
                             "UNIT_PRICE"	DECIMAL(12,2)		NOT NULL
);

CREATE TABLE "공급처 승인 발주 처리 테이블" (
                                    "RECEIVING_ID"	INTEGER		NOT NULL,
                                    "PO_ID"	INTEGER		NOT NULL,
                                    "RECEIVED_EMP_ID"	INTEGER		NOT NULL,
                                    "RECEIVING_DATE"	DATE		NOT NULL,
                                    "STATUS"	VARCHAR(20)	DEFAULT 'COMPLETED'	NOT NULL,
                                    "MEMO"	VARCHAR(500)		NULL,
                                    "CREATED_AT"	DATE		NULL
);

CREATE TABLE product-spec (
                              "CATEGORY_ID"	INTEGER		NOT NULL,
                              "CATEGORY_NAME"	VARCHAR(100)		NOT NULL,
                              "DESCRIPTION"	VARCHAR(300)		NULL,
                              "USE_YN"	CHAR(1)	DEFAULT 'Y'	NOT NULL,
                              "CREATED_AT"	DATE		NULL
);

CREATE TABLE "공급 발주 헤더 테이블" (
                                "PO_ID"	INTEGER		NOT NULL,
                                "SUPPLIER_ID"	INTEGER		NOT NULL,
                                "REQUEST_EMP_ID"	INTEGER		NOT NULL,
                                "APPROVE_EMP_ID"	INTEGER		NULL,
                                "PO_DATE"	DATE		NOT NULL,
                                "APPROVE_DATE"	DATE		NULL,
                                "STATUS"	VARCHAR(20)	DEFAULT 'REQUESTED'	NOT NULL,
                                "TOTAL_AMOUNT"	DECIMAL(15,2)	DEFAULT 0	NOT NULL,
                                "MEMO"	VARCHAR(500)		NULL,
                                "CREATED_AT"	DATE		NULL,
                                "UPDATED_AT"	DATE		NULL
);

CREATE TABLE "판매 승인 주문 출고 관리 테이블" (
                                      "SHIPMENT_ID"	INTEGER		NOT NULL,
                                      "SO_ID"	INTEGER		NOT NULL,
                                      "SHIPPED_EMP_ID"	INTEGER		NOT NULL,
                                      "SHIPMENT_DATE"	DATE		NOT NULL,
                                      "STATUS"	VARCHAR(20)	DEFAULT 'READY'	NOT NULL,
                                      "MEMO"	VARCHAR(500)		NULL,
                                      "CREATED_AT"	DATE		NULL
);

CREATE TABLE "공급관리 테이블" (
                            "SUPPLIER_ID"	INTEGER		NOT NULL,
                            "SUPPLIER_NAME"	VARCHAR(100)		NOT NULL,
                            "BUSINESS_NO"	VARCHAR(20)		NULL,
                            "MANAGER_NAME"	VARCHAR(50)		NULL,
                            "PHONE"	VARCHAR(20)		NULL,
                            "ADDRESS"	VARCHAR(300)		NULL,
                            "STATUS"	VARCHAR(20)	DEFAULT 'ACTIVE'	NOT NULL,
                            "CREATED_AT"	DATE		NULL,
                            "UPDATED_AT"	DATE		NULL
);

CREATE TABLE "REFRESH_TOKEN" (
                                 "JWT  token ID"	VARCHAR2(36)		NOT NULL,
                                 "EMP_ID"	INTEGER		NOT NULL,
                                 "EXPIRES_AT"	TIMESTAMP		NOT NULL
);

CREATE TABLE "공공api연동 이력 테이블" (
                                  "API_LOG_ID"	INTEGER		NOT NULL,
                                  "API_NAME"	VARCHAR(100)		NOT NULL,
                                  "REQUEST_URL"	VARCHAR(1000)		NULL,
                                  "REQUEST_PARAM"	TEXT		NULL,
                                  "RESPONSE_CODE"	VARCHAR(20)		NULL,
                                  "RESPONSE_BODY"	TEXT		NULL,
                                  "CREATED_AT"	DATE		NULL
);

CREATE TABLE "발주서 상세 품목 테이블" (
                                 "PO_DETAIL_ID"	INTEGER		NOT NULL,
                                 "PO_ID"	INTEGER		NOT NULL,
                                 "PRODUCT_ID"	INTEGER		NOT NULL,
                                 "ORDER_QTY"	INTEGER		NOT NULL,
                                 "UNIT_PRICE"	DECIMAL(12,2)		NOT NULL,
                                 "AMOUNT"	DECIMAL(15,2)		NOT NULL
);

CREATE TABLE "출고처 관리 테이블" (
                              "CUSTOMER_ID"	INTEGER		NOT NULL,
                              "CUSTOMER_NAME"	VARCHAR(100)		NOT NULL,
                              "CUSTOMER_TYPE"	VARCHAR(30)		NOT NULL,
                              "BUSINESS_NO"	VARCHAR(20)		NULL,
                              "CREDIT_LIMIT"	DECIMAL(15,2)	DEFAULT 0	NOT NULL,
                              "RECEIVABLE_BALANCE"	DECIMAL(15,2)	DEFAULT 0	NOT NULL,
                              "PHONE"	VARCHAR(20)		NULL,
                              "ADDRESS"	VARCHAR(300)		NULL,
                              "STATUS"	VARCHAR(20)	DEFAULT 'ACTIVE'	NOT NULL,
                              "CREATED_AT"	DATE		NULL,
                              "UPDATED_AT"	DATE		NULL
);

CREATE TABLE "재고관리 테이블" (
                            "INVENTORY_LOT_ID"	INTEGER		NOT NULL,
                            "PRODUCT_ID"	INTEGER		NOT NULL,
                            "LOT_NO"	VARCHAR(50)		NOT NULL,
                            "EXPIRY_DATE"	DATE		NOT NULL,
                            "CURRENT_QTY"	INTEGER	DEFAULT 0	NOT NULL,
                            "SAFETY_QTY"	INTEGER	DEFAULT 0	NOT NULL,
                            "STATUS"	VARCHAR(20)	DEFAULT 'NORMAL'	NOT NULL,
                            "LOCATION"	VARCHAR(100)		NOT NULL,
                            "CREATED_AT"	DATE		NULL,
                            "UPDATED_AT"	DATE		NULL
);

COMMENT ON COLUMN "재고관리 테이블"."LOCATION" IS '물리적 위치가 아니라 해당 장소안에서의 섹션';

CREATE TABLE "공급처 미지급금  관리 테이블" (
                                    "AP_ID"	INTEGER		NOT NULL,
                                    "SUPPLIER_ID"	INTEGER		NOT NULL,
                                    "PURCHASE_INVOICE_ID"	INTEGER		NOT NULL,
                                    "TOTAL_AMOUNT"	DECIMAL(15,2)		NOT NULL,
                                    "PAID_AMOUNT"	DECIMAL(15,2)	DEFAULT 0	NOT NULL,
                                    "REMAIN_AMOUNT"	DECIMAL(15,2)		NOT NULL,
                                    "DUE_DATE"	DATE		NULL,
                                    "STATUS"	VARCHAR(20)	DEFAULT 'UNPAID'	NOT NULL,
                                    "CREATED_AT"	DATE		NULL
);

CREATE TABLE employee (
                              "EMP_ID"	INTEGER		NOT NULL,
                              "LOGIN_ID"	VARCHAR(50)		NOT NULL,
                              "PASSWORD"	VARCHAR(255)		NOT NULL,
                              "EMP_NAME"	VARCHAR(50)		NOT NULL,
                              "PHONE"	VARCHAR(20)		NULL,
                              "EMAIL"	VARCHAR(100)		NULL,
                              "DEPT_ID"	INTEGER		NULL,
                              "ROLE_CODE"	VARCHAR(20)		NOT NULL,
                              "STATUS"	VARCHAR(20)	DEFAULT 'ACTIVE'	NOT NULL,
                              "HIRE_DATE"	DATE		NULL,
                              "CREATED_AT"	DATE		NULL,
                              "UPDATED_AT"	DATE		NULL
);

CREATE TABLE "반품 관리 테이블" (
                             "RETURN_ID"	INTEGER		NOT NULL,
                             "CUSTOMER_ID"	INTEGER		NOT NULL,
                             "SO_ID"	INTEGER		NULL,
                             "PRODUCT_ID"	INTEGER		NOT NULL,
                             "INVENTORY_LOT_ID"	INTEGER		NOT NULL,
                             "RETURN_QTY"	INTEGER		NOT NULL,
                             "REASON"	VARCHAR(500)		NULL,
                             "STATUS"	VARCHAR(20)	DEFAULT 'REQUESTED'	NOT NULL,
                             "CREATED_BY"	INTEGER		NOT NULL,
                             "CREATED_AT"	DATE		NULL
);

CREATE TABLE "판매 거래처 주문 관리 테이블" (
                                    "SO_ID"	INTEGER		NOT NULL,
                                    "CUSTOMER_ID"	INTEGER		NOT NULL,
                                    "REQUEST_EMP_ID"	INTEGER		NOT NULL,
                                    "APPROVE_EMP_ID"	INTEGER		NULL,
                                    "ORDER_DATE"	DATE		NOT NULL,
                                    "APPROVE_DATE"	DATE		NULL,
                                    "STATUS"	VARCHAR(20)	DEFAULT 'REQUESTED'	NOT NULL,
                                    "TOTAL_AMOUNT"	DECIMAL(15,2)	DEFAULT 0	NOT NULL,
                                    "MEMO"	VARCHAR(500)		NULL,
                                    "CREATED_AT"	DATE		NULL,
                                    "UPDATED_AT"	DATE		NULL
);

CREATE TABLE "거래처 수금 상태 관리 테이블" (
                                    "PAYMENT_ID"	INTEGER		NOT NULL,
                                    "AR_ID"	INTEGER		NOT NULL,
                                    "CUSTOMER_ID"	INTEGER		NOT NULL,
                                    "PAYMENT_DATE"	DATE		NOT NULL,
                                    "PAYMENT_AMOUNT"	DECIMAL(15,2)		NOT NULL,
                                    "PAYMENT_TYPE"	VARCHAR(20)		NOT NULL,
                                    "CREATED_BY"	INTEGER		NOT NULL,
                                    "CREATED_AT"	DATE		NULL
);

CREATE TABLE "DEPARTMENT" (
                              "DEPT_ID"	INTEGER		NOT NULL,
                              "DEPT_NAME"	VARCHAR(50)		NOT NULL,
                              "DESCRIPTION"	VARCHAR(300)		NULL,
                              "USE_YN"	CHAR(1)	DEFAULT 'Y'	NOT NULL,
                              "CREATED_AT"	DATE		NULL
);

CREATE TABLE "재고 상태 관리 테이블" (
                                "ALERT_ID"	INTEGER		NOT NULL,
                                "INVENTORY_LOT_ID"	INTEGER		NOT NULL,
                                "ALERT_TYPE"	VARCHAR(20)		NOT NULL,
                                "MESSAGE"	VARCHAR(500)		NOT NULL,
                                "IS_READ"	CHAR(1)	DEFAULT 'N'	NOT NULL,
                                "CREATED_AT"	DATE		NULL
);

CREATE TABLE "입출고 이력 관리 테이블" (
                                 "MOVEMENT_ID"	INTEGER		NOT NULL,
                                 "INVENTORY_LOT_ID"	INTEGER		NOT NULL,
                                 "MOVEMENT_TYPE"	VARCHAR(20)		NOT NULL,
                                 "QTY"	INTEGER		NOT NULL,
                                 "BEFORE_QTY"	INTEGER		NOT NULL,
                                 "AFTER_QTY"	INTEGER		NOT NULL,
                                 "REF_TABLE"	VARCHAR(50)		NULL,
                                 "REF_ID"	INTEGER		NULL,
                                 "CREATED_BY"	INTEGER		NOT NULL,
                                 "CREATED_AT"	DATE		NULL
);

CREATE TABLE "근태관리 테이블" (
                            "ATTENDANCE_ID"	INTEGER		NOT NULL,
                            "EMP_ID"	INTEGER		NOT NULL,
                            "WORK_DATE"	DATE		NOT NULL,
                            "CHECK_IN"	TIMESTAMP		NULL,
                            "CHECK_OUT"	TIMESTAMP		NULL,
                            "WORK_HOURS"	DECIMAL(5,2)		NULL,
                            "STATUS"	VARCHAR(20)	DEFAULT 'NORMAL'	NOT NULL,
                            "MEMO"	VARCHAR(300)		NULL,
                            "CREATED_AT"	DATE		NULL
);

CREATE TABLE "출고 관리 상세 테이블" (
                                "SHIPMENT_DETAIL_ID"	INTEGER		NOT NULL,
                                "SHIPMENT_ID"	INTEGER		NOT NULL,
                                "SO_DETAIL_ID"	INTEGER		NOT NULL,
                                "INVENTORY_LOT_ID"	INTEGER		NOT NULL,
                                "PRODUCT_ID"	INTEGER		NOT NULL,
                                "SHIPPED_QTY"	INTEGER		NOT NULL
);

CREATE TABLE "공급처에 대한 매입확정 매입전표 테이블" (
                                         "PURCHASE_INVOICE_ID"	INTEGER		NOT NULL,
                                         "PO_ID"	INTEGER		NOT NULL,
                                         "SUPPLIER_ID"	INTEGER		NOT NULL,
                                         "ISSUE_DATE"	DATE		NOT NULL,
                                         "TOTAL_AMOUNT"	DECIMAL(15,2)		NOT NULL,
                                         "STATUS"	VARCHAR(20)	DEFAULT 'ISSUED'	NOT NULL,
                                         "CREATED_AT"	DATE		NULL
);

CREATE TABLE "판매 거래처 주문 상세 테이블" (
                                    "SO_DETAIL_ID"	INTEGER		NOT NULL,
                                    "SO_ID"	INTEGER		NOT NULL,
                                    "PRODUCT_ID"	INTEGER		NOT NULL,
                                    "ORDER_QTY"	INTEGER		NOT NULL,
                                    "UNIT_PRICE"	DECIMAL(12,2)		NOT NULL,
                                    "AMOUNT"	DECIMAL(15,2)		NOT NULL
);

CREATE TABLE "AI_REPORT" (
                             "REPORT_ID"	INTEGER		NOT NULL,
                             "REPORT_TYPE"	VARCHAR(30)		NOT NULL,
                             "TITLE"	VARCHAR(200)		NOT NULL,
                             "CONTENT"	TEXT		NULL,
                             "CREATED_BY"	INTEGER		NOT NULL,
                             "CREATED_AT"	DATE		NOT NULL
);

CREATE TABLE "폐기 관리 테이블" (
                             "DISPOSAL_ID"	INTEGER		NOT NULL,
                             "INVENTORY_LOT_ID"	INTEGER		NOT NULL,
                             "PRODUCT_ID"	INTEGER		NOT NULL,
                             "DISPOSAL_QTY"	INTEGER		NOT NULL,
                             "REASON"	VARCHAR(500)		NULL,
                             "STATUS"	VARCHAR(20)	DEFAULT 'REQUESTED'	NOT NULL,
                             "CREATED_BY"	INTEGER		NOT NULL,
                             "CREATED_AT"	DATE		NULL
);

CREATE TABLE "AI_QUERY_LOG" (
                                "QUERY_ID"	INTEGER		NOT NULL,
                                "EMP_ID"	INTEGER		NOT NULL,
                                "USER_QUESTION"	TEXT		NOT NULL,
                                "GENERATED_SQL"	TEXT		NULL,
                                "RESULT_SUMMARY"	TEXT		NULL,
                                "CREATED_AT"	DATE		NULL
);

CREATE TABLE "매출 확정 및 매출전표 테이블" (
                                    "SALES_INVOICE_ID"	INTEGER		NOT NULL,
                                    "SO_ID"	INTEGER		NOT NULL,
                                    "CUSTOMER_ID"	INTEGER		NOT NULL,
                                    "ISSUE_DATE"	DATE		NOT NULL,
                                    "TOTAL_AMOUNT"	DECIMAL(15,2)		NOT NULL,
                                    "STATUS"	VARCHAR(20)	DEFAULT 'ISSUED'	NOT NULL,
                                    "CREATED_AT"	DATE		NULL
);

CREATE TABLE product (
                          "PRODUCT_ID"	INTEGER		NOT NULL,
                          "PRODUCT_CODE"	VARCHAR(50)		NOT NULL,
                          "PRODUCT_NAME"	VARCHAR(150)		NOT NULL,
                          "CATEGORY_ID"	INTEGER		NULL,
                          "MAKER_NAME"	VARCHAR(100)		NULL,
                          "UNIT"	VARCHAR(20)	DEFAULT 'EA'	NOT NULL,
                          "STANDARD_PURCHASE_PRICE"	DECIMAL(12,2)	DEFAULT 0	NOT NULL,
                          "STANDARD_SALES_PRICE"	DECIMAL(12,2)	DEFAULT 0	NOT NULL,
                          "IS_PRESCRIPTION"	CHAR(1)	DEFAULT 'N'	NOT NULL,
                          "STORAGE_TYPE"	VARCHAR(20)	DEFAULT 'ROOM'	NOT NULL,
                          "STATUS"	VARCHAR(20)	DEFAULT 'ACTIVE'	NOT NULL,
                          "CREATED_AT"	DATE		NULL,
                          "UPDATED_AT"	DATE		NULL
);

