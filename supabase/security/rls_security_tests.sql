-- Manual RLS/RPC security tests for Critical/High fixes.
--
-- How to use:
-- 1. Replace every TEST_* UUID/text value below with real staging data.
-- 2. Run one role block at a time in Supabase SQL Editor or psql.
-- 3. Each block uses `set local role authenticated` and a JWT sub claim.
-- 4. Every forbidden query should return 0 rows or false.
-- 5. This file is read-only if you leave it as-is; wrap local experiments in rollback.

begin;

-- Replace these values before running.
-- Use users that already exist in auth.users and public.users_profile.
-- pending user: is_active=false, approval_status='pending_approval'
-- scoped users: is_active=true, approval_status='approved'

-- =============================================================================
-- Pending approval user: should see no settlement rankings and no RPC rows.
-- =============================================================================
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000101', true);

select 'pending_direct_rankings_expected_0' as test_name, count(*) as visible_rows
from public.settlement_rankings;

select 'pending_rpc_rankings_expected_0' as test_name, count(*) as visible_rows
from public.list_global_settlement_rankings('2026-H1');

select 'pending_active_helper_expected_false' as test_name, public.is_active_user() as passed;

reset role;

-- =============================================================================
-- Mashkabat: should see only directly linked settlement rankings.
-- Replace allowed/forbidden settlement IDs.
-- =============================================================================
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000102', true);

select 'mashkabat_allowed_settlement_expected_true' as test_name,
  public.has_settlement_access('00000000-0000-0000-0000-000000001001'::uuid) as passed;

select 'mashkabat_forbidden_settlement_expected_false' as test_name,
  public.has_settlement_access('00000000-0000-0000-0000-000000001002'::uuid) as passed;

select 'mashkabat_forbidden_ranking_expected_0' as test_name, count(*) as visible_rows
from public.settlement_rankings
where settlement_id = '00000000-0000-0000-0000-000000001002'::uuid;

select 'mashkabat_rpc_all_rows_must_be_accessible' as test_name,
  coalesce(bool_and(public.has_settlement_access(settlement_id)), true) as passed
from public.list_global_settlement_rankings('2026-H1');

reset role;

-- =============================================================================
-- Machbal: should see only settlements in assigned regional councils.
-- =============================================================================
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000103', true);

select 'machbal_allowed_settlement_expected_true' as test_name,
  public.has_settlement_access('00000000-0000-0000-0000-000000001011'::uuid) as passed;

select 'machbal_forbidden_settlement_expected_false' as test_name,
  public.has_settlement_access('00000000-0000-0000-0000-000000001012'::uuid) as passed;

select 'machbal_forbidden_ranking_expected_0' as test_name, count(*) as visible_rows
from public.settlement_rankings
where settlement_id = '00000000-0000-0000-0000-000000001012'::uuid;

reset role;

-- =============================================================================
-- Eshkol officer: should see only settlements in assigned regional councils.
-- =============================================================================
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000104', true);

select 'eshkol_officer_allowed_settlement_expected_true' as test_name,
  public.has_settlement_access('00000000-0000-0000-0000-000000001021'::uuid) as passed;

select 'eshkol_officer_forbidden_settlement_expected_false' as test_name,
  public.has_settlement_access('00000000-0000-0000-0000-000000001022'::uuid) as passed;

select 'eshkol_officer_forbidden_ranking_expected_0' as test_name, count(*) as visible_rows
from public.settlement_rankings
where settlement_id = '00000000-0000-0000-0000-000000001022'::uuid;

reset role;

-- =============================================================================
-- Mepag: should see only settlements in assigned plaga.
-- =============================================================================
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000105', true);

select 'mepag_allowed_settlement_expected_true' as test_name,
  public.has_settlement_access('00000000-0000-0000-0000-000000001031'::uuid) as passed;

select 'mepag_forbidden_settlement_expected_false' as test_name,
  public.has_settlement_access('00000000-0000-0000-0000-000000001032'::uuid) as passed;

select 'mepag_rpc_all_rows_must_be_accessible' as test_name,
  coalesce(bool_and(public.has_settlement_access(settlement_id)), true) as passed
from public.list_global_settlement_rankings('2026-H1');

reset role;

-- =============================================================================
-- Instructor: current authorization model treats instructor as global read.
-- This verifies the RPC still requires an approved, active instructor.
-- =============================================================================
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000106', true);

select 'instructor_role_expected_true' as test_name,
  public.has_any_role(array['instructor']) as passed;

select 'instructor_rpc_rows_must_be_accessible' as test_name,
  coalesce(bool_and(public.has_settlement_access(settlement_id)), true) as passed
from public.list_global_settlement_rankings('2026-H1');

reset role;

-- =============================================================================
-- Super admin: approved active super_admin should have global access.
-- =============================================================================
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000107', true);

select 'super_admin_role_expected_true' as test_name,
  public.has_any_role(array['super_admin']) as passed;

select 'super_admin_global_access_expected_true' as test_name,
  public.has_settlement_access('00000000-0000-0000-0000-000000001041'::uuid) as passed;

select 'super_admin_rpc_expected_some_rows_if_period_has_data' as test_name,
  count(*) as visible_rows
from public.list_global_settlement_rankings('2026-H1');

reset role;

rollback;
