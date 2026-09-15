-- Apply before deploying the quick-response API and creator view.
begin;
create table public.quick_app_feedback (
 id uuid primary key,
 project_slug text not null references public.projects(slug) on delete cascade,
 visitor_hash text not null check (visitor_hash ~ '^[a-f0-9]{64}$'),
 reasons text[] not null check (cardinality(reasons) between 1 and 4 and reasons <@ array['too_much_to_read','hard_to_understand','unexpected','curious']::text[]),
 created_at timestamptz not null default now(),
 response_day date not null default (now() at time zone 'utc')::date,
 unique(project_slug,visitor_hash,response_day)
);
create index quick_app_feedback_project_date on public.quick_app_feedback(project_slug,created_at desc);
alter table public.quick_app_feedback enable row level security;
revoke all on public.quick_app_feedback from anon,authenticated;
grant select,insert on public.quick_app_feedback to service_role;
comment on table public.quick_app_feedback is 'Private early-exit responses. Creator access is owner-checked in the server dashboard. Not public reviews and not credit-bearing.';
commit;
