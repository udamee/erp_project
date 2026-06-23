-- 주문금액 및 디테일금액 검증을 위한 뷰
create or replace view v_sales_order_amount_check as
select
    so.so_id,
    so.customer_id,
    so.status,
    so.total_amount,
    sum(nvl(sod.amount, 0)) as detail_amount_sum,
    case
        when nvl(so.total_amount, 0) = sum(nvl(sod.amount, 0))
            then 'Y'
        else 'N'
        end as header_detail_amount_matched_yn,
    count(sod.so_detail_id) as detail_line_count,
    sum(nvl(sod.order_qty, 0) * nvl(sod.unit_price, 0)) as detail_calculated_amount_sum,
    case
        when sum(nvl(sod.amount, 0))
            = sum(nvl(sod.order_qty, 0) * nvl(sod.unit_price, 0))
            then 'Y'
        else 'N'
        end as detail_amount_calculated_matched_yn
from sales_order so
         left join sales_order_detail sod
                   on sod.so_id = so.so_id
group by
    so.so_id,
    so.customer_id,
    so.status,
    so.total_amount;

-- 전체 주문오더조회를 위한 뷰
create or replace view vw_sales_order_list as
select
    so.so_id as sales_order_id,
    cu.customer_name as customer_name,
    min(pro.product_name) as product_name,
    req_em.emp_name as request_employee_name,
    app_em.emp_name as approve_employee_name,
    so.order_date as order_date,
    so.status as status,
    so.approve_date as approve_date,
    so.total_amount as total_amount,
    so.memo as memo,
    so.created_at as created_at,
    so.updated_at as updated_at
from sales_order so
         join sales_order_detail sod on
    sod.so_id = so.so_id
         join customer cu on
    so.customer_id = cu.customer_id
         join product pro on
    pro.product_id = sod.product_id
         join employee req_em on
    req_em.emp_id = so.request_emp_id
         left join employee app_em on
    app_em.emp_id = so.approve_emp_id
group by
    so.so_id,
    cu.customer_name,
    req_em.emp_name,
    app_em.emp_name,
    so.order_date,
    so.status,
    so.approve_date,
    so.total_amount,
    so.memo,
    so.created_at,
    so.updated_at;
