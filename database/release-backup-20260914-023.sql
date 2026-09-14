-- One-time private snapshot before 023. Do not replay after migration.
begin;
set local lock_timeout='5s';
set local statement_timeout='60s';
do $$ begin
 if exists(select 1 from information_schema.columns where table_schema='public' and table_name='feedback_requests' and column_name='question') then raise exception '023 already present; stop and inspect';end if;
end $$;
lock table public.feedback_requests,public.credit_ledger,public.project_slot_grants,public.project_slot_assignments in share mode;
create schema release_backup_20260914_023;
revoke all on schema release_backup_20260914_023 from public,anon,authenticated,service_role;
create table release_backup_20260914_023.feedback_requests as table public.feedback_requests;
create table release_backup_20260914_023.credit_ledger as table public.credit_ledger;
create table release_backup_20260914_023.project_slot_grants as table public.project_slot_grants;
create table release_backup_20260914_023.project_slot_assignments as table public.project_slot_assignments;
create table release_backup_20260914_023.functions as
 select p.oid::regprocedure::text signature,pg_get_functiondef(p.oid) definition,p.proacl::text permissions
 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname in ('cw_project_slot_guard','cw_credit_request','cw_apply_qualification','cw_credit_review','cw_rate_feedback','cw_request_verification');
create table release_backup_20260914_023.metadata as select now() captured_at,
 '023 pre-release snapshot. Use a reviewed forward fix; the managed backup remains disaster recovery. Review retention after acceptance, target seven days. No storage objects changed.'::text recovery_scope;
revoke all on all tables in schema release_backup_20260914_023 from public,anon,authenticated,service_role;
do $$ declare t text;begin
 foreach t in array array['feedback_requests','credit_ledger','project_slot_grants','project_slot_assignments','functions','metadata'] loop
  execute format('alter table release_backup_20260914_023.%I enable row level security',t);
 end loop;
 if (select count(*) from release_backup_20260914_023.functions)<>6 then raise exception 'Expected six prior functions';end if;
end $$;
commit;
select captured_at,(select count(*) from release_backup_20260914_023.functions) functions_saved,
 (select count(*) from release_backup_20260914_023.project_slot_grants) grants_saved,
 not has_schema_privilege('anon','release_backup_20260914_023','USAGE') and not has_schema_privilege('authenticated','release_backup_20260914_023','USAGE') and not has_schema_privilege('service_role','release_backup_20260914_023','USAGE') private_snapshot
 from release_backup_20260914_023.metadata;
