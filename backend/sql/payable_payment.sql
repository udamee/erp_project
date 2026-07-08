-- Payable payment history table used by:
-- GET  /api/settlement/payables/payments
-- POST /api/settlement/payables/payment
--
-- Oracle repeatable script. It creates missing objects only.

DECLARE
    v_count NUMBER;
BEGIN
    SELECT COUNT(*)
      INTO v_count
      FROM USER_TABLES
     WHERE TABLE_NAME = 'PAYABLE_PAYMENT';

    IF v_count = 0 THEN
        EXECUTE IMMEDIATE '
            CREATE TABLE PAYABLE_PAYMENT (
                PAYABLE_PAYMENT_ID NUMBER NOT NULL,
                AP_ID NUMBER NOT NULL,
                SUPPLIER_ID NUMBER NOT NULL,
                PAYMENT_DATE DATE NOT NULL,
                PAYMENT_AMOUNT NUMBER(15,2) NOT NULL,
                PAYMENT_TYPE VARCHAR2(20) NOT NULL,
                CREATED_BY NUMBER NOT NULL,
                CREATED_AT DATE DEFAULT SYSDATE,
                CONSTRAINT PK_PAYABLE_PAYMENT PRIMARY KEY (PAYABLE_PAYMENT_ID)
            )';
    END IF;
END;
/

DECLARE
    v_count NUMBER;
BEGIN
    SELECT COUNT(*)
      INTO v_count
      FROM USER_SEQUENCES
     WHERE SEQUENCE_NAME = 'SEQ_PAYABLE_PAYMENT';

    IF v_count = 0 THEN
        EXECUTE IMMEDIATE 'CREATE SEQUENCE SEQ_PAYABLE_PAYMENT START WITH 1 INCREMENT BY 1 NOCACHE';
    END IF;
END;
/
