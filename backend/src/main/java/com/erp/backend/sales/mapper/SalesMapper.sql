//--특정 약품의 로트별 재고 상세 조회
select
    p.PRODUCT_ID,
    p.product_code as "약품코드",
    p.product_name as "약품명",
    p.maker_name as "제조사",
    p.is_prescription as "전문의약품",
    p.storage_type as "보관유형",
    p.status as "사용여부",
    il.lot_no as "로트번호",
    il.expiry_date as "유효기간",
    il.current_qty as "수량",
    il.location as "보관장소",
    il.status as "재고상태"
from product p join inventory_lot il
                    on p.product_id = il.product_id
where
    p.PRODUCT_ID = 4;

//--특정 약품 로트의 출고가능 조회
select
    p.PRODUCT_ID,
    p.product_code as "약품코드",
    p.product_name as "약품명",
    p.maker_name as "제조사",
    p.status as "사용여부",
    il.lot_no as "로트번호",
    il.expiry_date as "유효기간",
    il.current_qty as "수량",
    il.location as "보관장소",
    il.status as "재고상태"
from product p join inventory_lot il
                    on p.product_id = il.product_id
where
    p.PRODUCT_ID = 4
  and
    p.status='ACTIVE'
  and
    il.status='NORMAL'
  and
    il.current_qty > 0
  and
    il.expiry_date >= TRUNC(SYSDATE) + 11
order by
    il.expiry_date asc;

//--개별 상품 가용수량 재고 조회
select
    p.product_id,
    p.product_code as "약품코드",
    p.product_name as "약품명",
    p.status as "사용여부",
    sum(il.current_qty) as "가용수량"
from product p join inventory_lot il
                    on p.product_id = il.product_id
where
    p.product_id = 4
  and
    p.status = 'ACTIVE'
  and
    il.current_qty > 0
  and
    il.expiry_date > TRUNC(SYSDATE)+11
  and
    il.status = 'NORMAL'
group by
    p.product_id,
    p.product_code,
    p.product_name,
    p.status

select
    sod.so_detail_id,
    sod.so_id,
    sod.product_id,
    sod.order_qty,
    sod.unit_price,
    sod.amount,
    so.order_date,
    so.status,
    so.created_at
from sales_order_detail sod
         join sales_order so
              on so.so_id = sod.so_id
where
    so.so_id = 20;

//--주문상세 건수(존재여부) 확인
SELECT 1
FROM dual
WHERE EXISTS (
    SELECT 1
    FROM sales_order so
             JOIN sales_order_detail sod
                  ON sod.so_id = so.so_id
    WHERE so.so_id = 20
      AND so.status = 'REQUESTED'
);

//--주문 토탈금액 일치 여부 확인 뷰
create or replace view v_sales_order as
select
    so.so_id,
    so.customer_id,
    so.status,
    so.total_amount,
    sum(nvl(sod.amount, 0)) as sod_amount_sum,
    sum(nvl(sod.order_qty, 0) * nvl(sod.unit_price, 0)) as sod_calculated_amount_sum,
    count(sod.so_detail_id) as sod_count,
    case
        when nvl(so.total_amount, 0) = sum(nvl(sod.amount, 0))
            then 'Y'
        else 'N'
        end as so_sod_amount_matched_yn,
    case
        when sum(nvl(sod.amount, 0))
            = sum(nvl(sod.order_qty, 0) * nvl(sod.unit_price, 0))
            then 'Y'
        else 'N'
        end as sod_amount_calculated_matched_yn
from sales_order so
         left join sales_order_detail sod
                   on sod.so_id = so.so_id
group by
    so.so_id,
    so.customer_id,
    so.status,
    so.total_amount;

//--주문 기준 출고 가능 로트 후보 조회
SELECT
    so.so_id,
    sod.so_detail_id,
    pr.product_id,
    pr.product_name,
    il.lot_no,
    il.current_qty,
    il.expiry_date,
    pr.unit,
    sod.order_qty
FROM
    sales_order_detail sod
        JOIN sales_order so on
        so.so_id = sod.so_id
        JOIN product pr on
        sod.product_id = pr.product_id
        JOIN inventory_lot il on
        il.product_id = pr.product_id
WHERE
    pr.status='ACTIVE'
  and
    il.status='NORMAL'
  and
    il.current_qty > 0
  and
    il.expiry_date >= TRUNC(SYSDATE) + 11
  and
    so.so_id=4
order by
    il.expiry_date asc;


create sequence sales_order_sequence
    increment by 1
    start with 1
    nocycle
    nocache

create sequence sales_order_detail_sequence
    increment by 1
    start with 1
    nocycle
    nocache

select sales_order_detail_sequence.currval from dual;

insert into sales_order (
    SO_ID,
    CUSTOMER_ID,
    REQUEST_EMP_ID,
    ORDER_DATE,
    STATUS,
    TOTAL_AMOUNT,
    CREATED_AT
) select
      sales_order_sequence.NEXTVAL,
      c.customer_id,
      1,
      TO_DATE('2026-06-09 14:35', 'YYYY-MM-DD HH24:MI'),
      'REQUESTED',
      4000,
      SYSDATE
from customer c
where c.customer_id= 14;

insert into sales_order_detail (
    SO_DETAIL_ID,
    SO_ID,
    PRODUCT_ID,
    ORDER_QTY,
    UNIT_PRICE,
    AMOUNT
) values (
             sales_order_detail_sequence.NEXTVAL,
             sales_order_sequence.CURRVAL,
             4,
             10,
             100,
             1000
         );
//--주문 접수 상태 조회 쿼리
select
    so.so_id,
    so.status
from
    sales_order so
where
    so.so_id = 4
  and
    so.status='REQUESTED';


//--주문 조회용 상세미포한 단순 쿼리
select
    so.so_id,
    so.customer_id,
    cu.customer_name,
    req_em.employee_name as req_employee,
    so.approve_emp_id,
    app_em.employee_name as app_employee,
    so.order_date,
    so.approve_date,
    so.status,
    so.total_amount,
    so.memo,
    so.created_at,
    so.updated_at
from sales_order so
         join customer cu on
    so.customer_id = cu.customer_id
         join employee req_em on
    req_em.emp_id = so.request_emp_id
         left join employee app_em on
    app_em.emp_id = so.approve_emp_id
where
    so.so_id=1234

//--주문 조회용 상세포함 단건 쿼리
select
    so.so_id,
    so.customer_id,
    cu.customer_name,
    req_em.employee_name as req_employee,
    so.approve_emp_id,
    app_em.employee_name as app_employee,
    so.order_date,
    so.approve_date,
    so.status,
    so.total_amount,
    so.memo,
    so.created_at,
    so.updated_at,
    sod.order_qty
from sales_order so
         join customer cu on
    so.customer_id = cu.customer_id
         join employee req_em on
    req_em.emp_id = so.request_emp_id
         left join employee app_em on
    app_em.emp_id = so.approve_emp_id
         join sales_order_detail sod on
    sod.so_id = so.so_id
where
    so.so_id=1234
        //기존 주문 상태 확인 쿼리

//--주문 승인 조회용 단순조회쿼리
select so.so_id,
       cu.customer_id,
       cu.customer_name,
       cu.customer_type,
       so.order_date,
       em.employee_name,
       so.status,
       so.total_amount
from sales_order so
         join customer cu
              on cu.customer_id=so.customer_id
         join employee em
              on em.emp_id=so.request_emp_id
where so.status='REQUESTED'
  and so.so_id=4;

//--주문 승인 조회용 상세조회쿼리
select cu.customer_id,
       cu.customer_name,
       cu.customer_type,
       pd.product_code,
       pd.product_name,
       pd.maker_name,
       so.order_date,
       em.employee_name,
       so.so_id,
       sod.so_detail_id,
       so.status,
       so.total_amount,
       sod.product_id,
       sod.order_qty,
       sod.unit_price,
       sod.amount
from sales_order so
         join sales_order_detail sod
              on so.so_id = sod.so_id
         join customer cu
              on cu.customer_id = so.customer_id
         join employee em
              on em.emp_id = so.request_emp_id
         join product pd
              on pd.product_id = sod.product_id
where so.status = 'REQUESTED'
  and so.so_id = 4;

//--주문 승인 쿼리
update sales_order
set
    approve_emp_id=400,
    approve_date=SYSDATE,
    status='APPROVED',
    updated_at=SYSDATE
where so_id = 4
  and status = 'REQUESTED';
