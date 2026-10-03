-- App activity alerts are recorded with the input; email delivery is retryable.
begin;
create table public.notification_email_queue (
 notification_id uuid primary key references public.notifications(id) on delete cascade,
 attempts integer not null default 0,
 available_at timestamptz not null default now(),
 lease_id uuid,
 sent_at timestamptz,
 skipped_at timestamptz
);
alter table public.notification_email_queue enable row level security;
revoke all on public.notification_email_queue from public,anon,authenticated;
grant all on public.notification_email_queue to service_role;
create index notification_email_pending on public.notification_email_queue(available_at) where sent_at is null and skipped_at is null;
create function public.cw_queue_activity_email() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if new.kind in ('feedback','comment','quick-feedback') then
  insert into notification_email_queue(notification_id) values(new.id) on conflict do nothing;
 end if;
 return new;
end $$;
create trigger activity_email_queue after insert on public.notifications for each row execute function public.cw_queue_activity_email();
create function public.cw_notify_quick_feedback() returns trigger language plpgsql security definer set search_path=public as $$
declare owner_id uuid; app_name text;
begin
 select owner_user_id,title into owner_id,app_name from projects where slug=new.project_slug;
 if owner_id is not null and coalesce((select feedback_alerts from account_preferences where user_id=owner_id),true) then
  insert into notifications(user_id,kind,title,href) values(owner_id,'quick-feedback','New quick response on '||app_name,'/dashboard/messages?project='||new.project_slug);
 end if;
 return new;
end $$;
create trigger quick_feedback_notification after insert on public.quick_app_feedback for each row execute function public.cw_notify_quick_feedback();
-- Lock only a bounded batch. A crashed worker's lease expires after 5 minutes.
create function public.cw_claim_activity_emails(p_limit integer default 10)
returns setof public.notification_email_queue language sql security definer set search_path=public as $$
 update notification_email_queue q set attempts=q.attempts+1,lease_id=gen_random_uuid(),available_at=now()+interval '5 minutes'
 where q.notification_id in (
  select notification_id from notification_email_queue
  where sent_at is null and skipped_at is null and available_at<=now()
  order by available_at limit greatest(1,least(p_limit,10)) for update skip locked
 ) returning q.*;
$$;
revoke all on function public.cw_queue_activity_email(),public.cw_notify_quick_feedback(),public.cw_claim_activity_emails(integer) from public,anon,authenticated;
grant execute on function public.cw_claim_activity_emails(integer) to service_role;
commit;
