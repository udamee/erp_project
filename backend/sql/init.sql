-- ============================================
-- ERP 프로젝트 DB 초기 설정
-- 실행 순서: 1 → 2 → 3 → 4 → 5
-- 실행 계정: SYSTEM
-- ============================================

-- 1. Oracle 버전 확인
SELECT * FROM V$VERSION;

-- 2. 현재 컨테이너 확인 (CDB$ROOT 이어야 함)
SHOW CON_NAME;

-- 3. PDB로 전환
ALTER SESSION SET CONTAINER = XEPDB1;

-- 4. ERP 계정 생성
CREATE USER erp IDENTIFIED BY erp1234;

-- 5. 권한 부여
GRANT CONNECT, RESOURCE, DBA TO erp;