-- Complete the transactional email loop for members and administrators while
-- keeping every event idempotent and stopping permanently failed retries.
begin;

alter table public.notification_email_queue
 add column if not exists failed_at timestamptz,
 add column if not exists last_error text;

drop index if exists public.notification_email_pending;
create index notification_email_pending on public.notification_email_queue(available_at)
 where sent_at is null and skipped_at is null and failed_at is null;

create or replace function public.cw_queue_activity_email() returns trigger
language plpgsql security definer set search_path=public as $$
begin
 if new.kind in ('feedback','comment','quick-feedback','message','publication','support','admin') then
  insert into notification_email_queue(notification_id) values(new.id) on conflict do nothing;
 end if;
 return new;
end $$;

-- Match the application's stable notification IDs so a later dashboard visit
-- cannot create a second copy of the same administrator event.
create or replace function public.cw_notification_id(p_key text) returns uuid
language sql immutable set search_path=public,extensions as $$
 select (substr(h,1,8)||'-'||substr(h,9,4)||'-'||substr(h,13,4)||'-'||substr(h,17,4)||'-'||substr(h,21,12))::uuid
 from (select encode(digest(convert_to(p_key,'UTF8'),'sha256'),'hex') h) value;
$$;

create or replace function public.cw_notify_admin_new_member() returns trigger
language plpgsql security definer set search_path=public,extensions as $$
begin
 insert into notifications(id,user_id,kind,title,href)
 select cw_notification_id(a.id||':member:'||new.id),a.id,'admin','A new member joined TryMyBuild','/admin/workspace?tab=members'
 from users a where a.system_role='admin' and a.account_status='active' and a.id<>new.id
 on conflict(id) do nothing;
 return new;
end $$;
drop trigger if exists admin_new_member_notification on public.users;
create trigger admin_new_member_notification after insert on public.users
 for each row execute function public.cw_notify_admin_new_member();

create or replace function public.cw_notify_admin_first_publish() returns trigger
language plpgsql security definer set search_path=public,extensions as $$
begin
 if new.listing_status='published' and old.listing_status<>'published' and old.published_at is null then
  insert into notifications(id,user_id,kind,title,href)
  select cw_notification_id(a.id||':first-publish:'||new.id),a.id,'admin','New project published: '||new.title,'/admin/project?slug='||new.slug
  from users a where a.system_role='admin' and a.account_status='active' and a.id<>new.owner_user_id
  on conflict(id) do nothing;
 end if;
 return new;
end $$;
drop trigger if exists admin_first_publish_notification on public.projects;
create trigger admin_first_publish_notification after update of listing_status on public.projects
 for each row execute function public.cw_notify_admin_first_publish();

create or replace function public.cw_notify_admin_support_case() returns trigger
language plpgsql security definer set search_path=public,extensions as $$
begin
 insert into notifications(id,user_id,kind,title,href)
 select cw_notification_id(a.id||':case:'||new.id||':'||new.revision),a.id,'admin','New '||new.kind||' request: '||new.subject,'/admin/workspace?tab=cases&case='||new.id
 from users a where a.system_role='admin' and a.account_status='active' and a.id<>new.user_id
 on conflict(id) do nothing;
 return new;
end $$;
drop trigger if exists admin_support_case_notification on public.support_cases;
create trigger admin_support_case_notification after insert on public.support_cases
 for each row execute function public.cw_notify_admin_support_case();

-- A comment creates one creator alert. Publishing the same comment later must
-- not send the creator a second email for the same contribution.
drop trigger if exists project_comment_notification on public.project_experiences;
create trigger project_comment_notification after insert on public.project_experiences
 for each row execute function public.cw_notify_project_comment();

create or replace function public.cw_claim_activity_emails(p_limit integer default 10)
returns setof public.notification_email_queue language sql security definer set search_path=public as $$
 update notification_email_queue q
 set attempts=q.attempts+1,lease_id=gen_random_uuid(),available_at=now()+interval '5 minutes'
 where q.notification_id in (
  select notification_id from notification_email_queue
  where sent_at is null and skipped_at is null and failed_at is null and available_at<=now() and attempts<8
  order by available_at limit greatest(1,least(p_limit,10)) for update skip locked
 ) returning q.*;
$$;

revoke all on function public.cw_notification_id(text),public.cw_notify_admin_new_member(),public.cw_notify_admin_first_publish(),public.cw_notify_admin_support_case() from public,anon,authenticated;
grant execute on function public.cw_notification_id(text),public.cw_notify_admin_new_member(),public.cw_notify_admin_first_publish(),public.cw_notify_admin_support_case() to service_role;
commit;
