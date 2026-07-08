-- ============================================================================
-- ERP integration-test seed data (Oracle)
--
-- Purpose
--   Provides only the master/reference data needed to exercise the application
--   flow through APIs. Transactional rows such as purchase orders, receivings,
--   inventory lots, sales orders, shipments, invoices, and settlements are not
--   inserted here; those should be created by the integration scenario itself.
--
-- Test account password (all accounts): admin1234
-- BCrypt: $2a$10$jASf.CcUga.DUODWW5yM9OPafjQXcQ5doDSahzNq3bryCjss1ENJW
--
-- This script is repeatable. Rows are matched by stable business keys and are
-- updated or inserted with MERGE.
-- ============================================================================

WHENEVER SQLERROR EXIT SQL.SQLCODE ROLLBACK;

-- ---------------------------------------------------------------------------
-- 1. Departments
-- ---------------------------------------------------------------------------
MERGE INTO DEPARTMENT d
USING (
    SELECT 'DEPT_HR'  AS dept_code, '인사부'       AS dept_name, '인사 및 근태 관리' AS description FROM DUAL
    UNION ALL
    SELECT 'DEPT_LOG', '물류관리부', '발주, 입고, 재고 및 출고 관리' FROM DUAL
    UNION ALL
    SELECT 'DEPT_SAL', '영업관리부', '거래처 및 판매 주문 관리' FROM DUAL
    UNION ALL
    SELECT 'DEPT_FIN', '경영지원부', '회계, 채권, 채무 및 정산 관리' FROM DUAL
) s
ON (d.DEPT_CODE = s.DEPT_CODE)
WHEN MATCHED THEN
    UPDATE SET d.USE_YN = 'Y'
WHEN NOT MATCHED THEN
    INSERT (DEPT_ID, DEPT_CODE, DEPT_NAME, DESCRIPTION, USE_YN, CREATED_AT)
    VALUES (SEQ_DEP_ID.NEXTVAL, s.dept_code, s.dept_name, s.description, 'Y', SYSDATE);

-- ---------------------------------------------------------------------------
-- 2. Employees
--    ACTIVE accounts cover every department and role required by the workflow.
--    PENDING/INACTIVE/REJECTED accounts cover employee-admin scenarios.
-- ---------------------------------------------------------------------------
MERGE INTO EMPLOYEE e
USING (
    SELECT 'it_admin' AS login_id, '통합 관리자' AS emp_name, '010-9000-0001' AS phone,
           'it_admin@erp.test' AS email, 'DEPT_FIN' AS dept_code, 'ADMIN' AS role_code,
           'ACTIVE' AS status, DATE '2021-01-04' AS hire_date FROM DUAL
    UNION ALL
    SELECT 'it_hr_manager', '통합 인사매니저', '010-9000-0002', 'it_hr_manager@erp.test',
           'DEPT_HR', 'MANAGER', 'ACTIVE', DATE '2022-02-07' FROM DUAL
    UNION ALL
    SELECT 'it_log_manager', '통합 물류매니저', '010-9000-0003', 'it_log_manager@erp.test',
           'DEPT_LOG', 'MANAGER', 'ACTIVE', DATE '2022-03-07' FROM DUAL
    UNION ALL
    SELECT 'it_log_staff', '통합 물류사원', '010-9000-0004', 'it_log_staff@erp.test',
           'DEPT_LOG', 'STAFF', 'ACTIVE', DATE '2023-04-03' FROM DUAL
    UNION ALL
    SELECT 'it_sales_manager', '통합 영업매니저', '010-9000-0005', 'it_sales_manager@erp.test',
           'DEPT_SAL', 'MANAGER', 'ACTIVE', DATE '2022-05-02' FROM DUAL
    UNION ALL
    SELECT 'it_sales_staff', '통합 영업사원', '010-9000-0006', 'it_sales_staff@erp.test',
           'DEPT_SAL', 'STAFF', 'ACTIVE', DATE '2023-06-05' FROM DUAL
    UNION ALL
    SELECT 'it_fin_manager', '통합 재무매니저', '010-9000-0007', 'it_fin_manager@erp.test',
           'DEPT_FIN', 'MANAGER', 'ACTIVE', DATE '2022-07-04' FROM DUAL
    UNION ALL
    SELECT 'it_fin_staff', '통합 재무사원', '010-9000-0008', 'it_fin_staff@erp.test',
           'DEPT_FIN', 'STAFF', 'ACTIVE', DATE '2023-08-07' FROM DUAL
    UNION ALL
    SELECT 'it_pending', '통합 승인대기', '010-9000-0009', 'it_pending@erp.test',
           'DEPT_LOG', 'STAFF', 'PENDING', NULL FROM DUAL
    UNION ALL
    SELECT 'it_inactive', '통합 비활성사원', '010-9000-0010', 'it_inactive@erp.test',
           'DEPT_SAL', 'STAFF', 'INACTIVE', DATE '2024-01-08' FROM DUAL
    UNION ALL
    SELECT 'it_rejected', '통합 승인거절', '010-9000-0011', 'it_rejected@erp.test',
           'DEPT_HR', 'STAFF', 'REJECTED', NULL FROM DUAL
) s
ON (e.LOGIN_ID = s.login_id)
WHEN MATCHED THEN
    UPDATE SET
        e.PASSWORD = '$2a$10$jASf.CcUga.DUODWW5yM9OPafjQXcQ5doDSahzNq3bryCjss1ENJW',
        e.EMP_NAME = s.emp_name,
        e.PHONE = s.phone,
        e.EMAIL = s.email,
        e.DEPT_ID = (SELECT d.DEPT_ID FROM DEPARTMENT d WHERE d.DEPT_CODE = s.dept_code),
        e.ROLE_CODE = s.role_code,
        e.STATUS = s.status,
        e.HIRE_DATE = s.hire_date,
        e.UPDATED_AT = SYSDATE
WHEN NOT MATCHED THEN
    INSERT (
        EMP_ID, LOGIN_ID, PASSWORD, EMP_NAME, PHONE, EMAIL, DEPT_ID,
        ROLE_CODE, STATUS, HIRE_DATE, CREATED_AT, UPDATED_AT
    )
    VALUES (
        SEQ_EMPLOYEE.NEXTVAL,
        s.login_id,
        '$2a$10$jASf.CcUga.DUODWW5yM9OPafjQXcQ5doDSahzNq3bryCjss1ENJW',
        s.emp_name,
        s.phone,
        s.email,
        (SELECT d.DEPT_ID FROM DEPARTMENT d WHERE d.DEPT_CODE = s.dept_code),
        s.role_code,
        s.status,
        s.hire_date,
        SYSDATE,
        SYSDATE
    );

-- ---------------------------------------------------------------------------
-- 3. Department/role exception authorities
--    These are seeded for token-claim verification even though business APIs
--    do not yet enforce EX_* authorities.
-- ---------------------------------------------------------------------------
MERGE INTO DEPT_ROLE_EXCEPTION x
USING (
    SELECT 'DEPT_LOG' AS dept_code, 'ROLE_MANAGER' AS role_code,
           '재고 조정관' AS exception_title, 'EX_LOG_STOCK_ADJUST' AS exception_auth,
           '물류 매니저 재고 조정 권한' AS description FROM DUAL
    UNION ALL
    SELECT 'DEPT_LOG', 'ROLE_STAFF', '관리약사', 'EX_LOG_MED_MANAGE',
           '전문 의약품 취급 권한' FROM DUAL
    UNION ALL
    SELECT 'DEPT_FIN', 'ROLE_MANAGER', '고액 결재권자', 'EX_FIN_HIGH_AMOUNT',
           '고액 정산 승인 권한' FROM DUAL
    UNION ALL
    SELECT 'DEPT_HR', 'ROLE_MANAGER', '인사평가 위원', 'EX_HR_EVAL_VIEW',
           '인사평가 정보 조회 권한' FROM DUAL
) s
ON (
    x.DEPT_CODE = s.dept_code
    AND x.ROLE_CODE = s.role_code
    AND x.EXCEPTION_AUTH = s.exception_auth
)
WHEN MATCHED THEN
    UPDATE SET
        x.EXCEPTION_TITLE = s.exception_title,
        x.DESCRIPTION = s.description,
        x.USE_YN = 'Y'
WHEN NOT MATCHED THEN
    INSERT (
        EXCEPTION_ID, DEPT_CODE, ROLE_CODE, EXCEPTION_TITLE,
        EXCEPTION_AUTH, DESCRIPTION, USE_YN, CREATED_AT
    )
    VALUES (
        SEQ_DEPT_ROLE_EXCEPTION.NEXTVAL, s.dept_code, s.role_code,
        s.exception_title, s.exception_auth, s.description, 'Y', SYSDATE
    );

-- ---------------------------------------------------------------------------
-- 4. Suppliers
-- ---------------------------------------------------------------------------
MERGE INTO SUPPLIER sp
USING (
    SELECT '999-81-00001' AS business_no, '통합 한빛제약' AS supplier_name,
           '공급담당자' AS manager_name, '02-9000-1001' AS phone,
           '서울특별시 강남구 테스트로 10' AS address, 'ACTIVE' AS status FROM DUAL
    UNION ALL
    SELECT '999-81-00002', '통합 새봄바이오', '물류담당자', '02-9000-1002',
           '경기도 성남시 테스트로 20', 'ACTIVE' FROM DUAL
    UNION ALL
    SELECT '999-81-00003', '통합 거래중지 공급처', '중지담당자', '02-9000-1003',
           '서울특별시 중구 테스트로 30', 'INACTIVE' FROM DUAL
) s
ON (sp.BUSINESS_NO = s.business_no)
WHEN MATCHED THEN
    UPDATE SET
        sp.SUPPLIER_NAME = s.supplier_name,
        sp.MANAGER_NAME = s.manager_name,
        sp.PHONE = s.phone,
        sp.ADDRESS = s.address,
        sp.STATUS = s.status,
        sp.UPDATED_AT = SYSDATE
WHEN NOT MATCHED THEN
    INSERT (
        SUPPLIER_ID, SUPPLIER_NAME, BUSINESS_NO, MANAGER_NAME,
        PHONE, ADDRESS, STATUS, CREATED_AT, UPDATED_AT
    )
    VALUES (
        SEQ_SUPPLIER.NEXTVAL, s.supplier_name, s.business_no, s.manager_name,
        s.phone, s.address, s.status, SYSDATE, SYSDATE
    );

-- ---------------------------------------------------------------------------
-- 5. Products
-- ---------------------------------------------------------------------------
MERGE INTO PRODUCT p
USING (
    SELECT 'IT-PROD-001' AS product_code, '통합 해열진통정' AS product_name,
           '한빛제약' AS maker_name, 'BOX' AS unit,
           12000 AS purchase_price, 18000 AS sales_price,
           'N' AS is_prescription, 'ROOM' AS storage_type,
           'ACTIVE' AS status, 20 AS safety_qty FROM DUAL
    UNION ALL
    SELECT 'IT-PROD-002', '통합 전문항생제', '새봄바이오', 'BOX',
           28000, 39000, 'Y', 'ROOM', 'ACTIVE', 15 FROM DUAL
    UNION ALL
    SELECT 'IT-PROD-003', '통합 냉장주사제', '한빛제약', 'EA',
           45000, 62000, 'Y', 'COLD', 'ACTIVE', 10 FROM DUAL
    UNION ALL
    SELECT 'IT-PROD-999', '통합 판매중지제품', '테스트제약', 'BOX',
           5000, 8000, 'N', 'ROOM', 'INACTIVE', 5 FROM DUAL
) s
ON (p.PRODUCT_CODE = s.product_code)
WHEN MATCHED THEN
    UPDATE SET
        p.PRODUCT_NAME = s.product_name,
        p.MAKER_NAME = s.maker_name,
        p.UNIT = s.unit,
        p.STANDARD_PURCHASE_PRICE = s.purchase_price,
        p.STANDARD_SALES_PRICE = s.sales_price,
        p.IS_PRESCRIPTION = s.is_prescription,
        p.STORAGE_TYPE = s.storage_type,
        p.STATUS = s.status,
        p.SAFETY_QTY = s.safety_qty,
        p.UPDATED_AT = SYSDATE
WHEN NOT MATCHED THEN
    INSERT (
        PRODUCT_ID, PRODUCT_CODE, PRODUCT_NAME, MAKER_NAME, UNIT,
        STANDARD_PURCHASE_PRICE, STANDARD_SALES_PRICE, IS_PRESCRIPTION,
        STORAGE_TYPE, STATUS, SAFETY_QTY, CREATED_AT, UPDATED_AT
    )
    VALUES (
        SEQ_PRODUCT.NEXTVAL, s.product_code, s.product_name, s.maker_name, s.unit,
        s.purchase_price, s.sales_price, s.is_prescription,
        s.storage_type, s.status, s.safety_qty, SYSDATE, SYSDATE
    );

-- Product specifications
MERGE INTO PRODUCT_SPEC ps
USING (
    SELECT p.PRODUCT_ID, '기본 규격' AS spec_name, '통합 테스트 기본 규격' AS description
    FROM PRODUCT p
    WHERE p.PRODUCT_CODE IN ('IT-PROD-001', 'IT-PROD-002', 'IT-PROD-003')
) s
ON (ps.PRODUCT_ID = s.PRODUCT_ID AND ps.SPEC_NAME = s.spec_name)
WHEN MATCHED THEN
    UPDATE SET ps.DESCRIPTION = s.description, ps.USE_YN = 'Y'
WHEN NOT MATCHED THEN
    INSERT (SPEC_ID, PRODUCT_ID, SPEC_NAME, DESCRIPTION, USE_YN, CREATED_AT)
    VALUES (SEQ_PRODUCT_SPEC.NEXTVAL, s.PRODUCT_ID, s.spec_name, s.description, 'Y', SYSDATE);

-- ---------------------------------------------------------------------------
-- 6. Customers
-- ---------------------------------------------------------------------------
MERGE INTO CUSTOMER c
USING (
    SELECT '999-91-00001' AS business_no, '통합 서울병원' AS customer_name,
           'HOSPITAL' AS customer_type, 100000000 AS credit_limit,
           0 AS receivable_balance, '02-9000-2001' AS phone,
           '서울특별시 종로구 테스트로 100' AS address, 'ACTIVE' AS status FROM DUAL
    UNION ALL
    SELECT '999-91-00002', '통합 행복약국', 'PHARMACY', 30000000, 0,
           '02-9000-2002', '서울특별시 마포구 테스트로 200', 'ACTIVE' FROM DUAL
    UNION ALL
    SELECT '999-91-00003', '통합 거래중지병원', 'HOSPITAL', 10000000, 0,
           '02-9000-2003', '경기도 수원시 테스트로 300', 'INACTIVE' FROM DUAL
) s
ON (c.BUSINESS_NO = s.business_no)
WHEN MATCHED THEN
    UPDATE SET
        c.CUSTOMER_NAME = s.customer_name,
        c.CUSTOMER_TYPE = s.customer_type,
        c.CREDIT_LIMIT = s.credit_limit,
        c.RECEIVABLE_BALANCE = s.receivable_balance,
        c.PHONE = s.phone,
        c.ADDRESS = s.address,
        c.STATUS = s.status,
        c.UPDATED_AT = SYSDATE
WHEN NOT MATCHED THEN
    INSERT (
        CUSTOMER_ID, CUSTOMER_NAME, CUSTOMER_TYPE, BUSINESS_NO,
        CREDIT_LIMIT, RECEIVABLE_BALANCE, PHONE, ADDRESS,
        STATUS, CREATED_AT, UPDATED_AT
    )
    VALUES (
        SEQ_CUSTOMER.NEXTVAL, s.customer_name, s.customer_type, s.business_no,
        s.credit_limit, s.receivable_balance, s.phone, s.address,
        s.status, SYSDATE, SYSDATE
    );

-- ---------------------------------------------------------------------------
-- 7. Historical attendance samples
--    Fixed dates keep this section idempotent across repeated runs.
-- ---------------------------------------------------------------------------
MERGE INTO ATTENDANCE a
USING (
    SELECT e.EMP_ID, DATE '2026-06-15' AS work_date,
           TIMESTAMP '2026-06-15 08:52:00' AS check_in,
           TIMESTAMP '2026-06-15 18:04:00' AS check_out,
           9.20 AS work_hours, 'NORMAL' AS status, '통합 테스트 정상근무' AS memo
    FROM EMPLOYEE e WHERE e.LOGIN_ID = 'it_log_staff'
    UNION ALL
    SELECT e.EMP_ID, DATE '2026-06-16',
           TIMESTAMP '2026-06-16 09:18:00', TIMESTAMP '2026-06-16 18:02:00',
           8.73, 'LATE', '통합 테스트 지각'
    FROM EMPLOYEE e WHERE e.LOGIN_ID = 'it_log_staff'
    UNION ALL
    SELECT e.EMP_ID, DATE '2026-06-17',
           NULL, NULL, NULL, 'LEAVE', '통합 테스트 휴가'
    FROM EMPLOYEE e WHERE e.LOGIN_ID = 'it_sales_staff'
) s
ON (a.EMP_ID = s.EMP_ID AND a.WORK_DATE = s.work_date)
WHEN MATCHED THEN
    UPDATE SET
        a.CHECK_IN = s.check_in,
        a.CHECK_OUT = s.check_out,
        a.WORK_HOURS = s.work_hours,
        a.STATUS = s.status,
        a.MEMO = s.memo
WHEN NOT MATCHED THEN
    INSERT (
        ATTENDANCE_ID, EMP_ID, WORK_DATE, CHECK_IN, CHECK_OUT,
        WORK_HOURS, STATUS, MEMO, CREATED_AT
    )
    VALUES (
        SEQ_ATTENDANCE.NEXTVAL, s.EMP_ID, s.work_date, s.check_in, s.check_out,
        s.work_hours, s.status, s.memo, SYSDATE
    );

COMMIT;

-- ---------------------------------------------------------------------------
-- Verification summary
-- ---------------------------------------------------------------------------
SELECT LOGIN_ID, EMP_NAME, ROLE_CODE, STATUS
FROM EMPLOYEE
WHERE LOGIN_ID LIKE 'it\_%' ESCAPE '\'
ORDER BY LOGIN_ID;

SELECT PRODUCT_CODE, PRODUCT_NAME, STATUS
FROM PRODUCT
WHERE PRODUCT_CODE LIKE 'IT-PROD-%'
ORDER BY PRODUCT_CODE;

SELECT BUSINESS_NO, SUPPLIER_NAME, STATUS
FROM SUPPLIER
WHERE BUSINESS_NO LIKE '999-81-%'
ORDER BY BUSINESS_NO;

SELECT BUSINESS_NO, CUSTOMER_NAME, STATUS
FROM CUSTOMER
WHERE BUSINESS_NO LIKE '999-91-%'
ORDER BY BUSINESS_NO;
