begin;
alter table public.profiles add column if not exists creator_type text not null default 'independent' check(creator_type in ('independent','company'));
alter table public.profiles add column if not exists location text not null default '' check(length(location)<=100);
alter table public.profiles add column if not exists location_public boolean not null default false;
create or replace function public.cw_badge_progress(p_user uuid)
returns table(reviews bigint,creators bigint,has_published boolean,ownership_confirmed boolean,verified boolean,case_id uuid)
language sql stable set search_path=public as $$
 select count(*)::bigint,count(distinct p.owner_user_id)::bigint,
 exists(select 1 from projects where owner_user_id=p_user and listing_status='published' and not is_studio),
 exists(select 1 from projects where owner_user_id=p_user and listing_status='published' and ownership_status='verified' and not is_studio),
 coalesce((select verified from profiles where user_id=p_user and creator_type='independent'),false),
 (select id from support_cases where user_id=p_user and kind='verification' and status in ('open','waiting') order by created_at desc limit 1)
 from feedback_qualifications q join creator_feedback f on f.id=q.feedback_id join projects p on p.slug=q.project_slug
 where q.user_id=p_user and q.status='qualified' and p.owner_user_id<>p_user and f.helpful<>'not_tried'
 and f.moderation_status<>'hidden' and (f.moderation_status='published' or q.reviewed_by is not null);
$$;
create or replace function public.cw_request_verification(p_user uuid,p_id uuid,p_subject text,p_message text,p_project text)
returns uuid language plpgsql set search_path=public as $$
declare progress record;existing support_cases%rowtype;
begin
 perform pg_advisory_xact_lock(7112026);
 if not exists(select 1 from users where id=p_user and account_status='active') or not exists(select 1 from profiles where user_id=p_user and creator_type='independent') then raise exception 'Verification is for active independent creators';end if;
 select * into progress from cw_badge_progress(p_user);
 if progress.case_id is not null then return progress.case_id;end if;
 select * into existing from support_cases where id=p_id;
 if found then if existing.user_id=p_user and existing.kind='verification' then return existing.id;end if;raise exception 'Request ID already used';end if;
 if progress.verified then raise exception 'Already verified';end if;
 if progress.reviews<5 or progress.creators<3 or not progress.has_published then raise exception 'Give five approved qualifying reviews across three other creators and publish an app';end if;
 if p_subject is null or length(trim(p_subject)) not between 3 and 120 or p_message is null or length(trim(p_message)) not between 10 and 4000 then raise exception 'Explain your connection to your app';end if;
 if p_project is not null and not exists(select 1 from projects where slug=p_project and owner_user_id=p_user and listing_status='published' and not is_studio) then raise exception 'Choose your published app';end if;
 insert into support_cases(id,user_id,kind,subject,message,project_slug) values(p_id,p_user,'verification',trim(p_subject),trim(p_message),p_project);return p_id;
end $$;
create function public.cw_badge_guard() returns trigger language plpgsql set search_path=public as $$
declare s record;
begin
 if new.verified and (not old.verified or new.creator_type<>old.creator_type) then
  select * into s from cw_badge_progress(new.user_id);
  if new.creator_type<>'independent' or s.reviews<5 or s.creators<3 or not s.ownership_confirmed then raise exception 'Five qualifying approved reviews, three other creators and app ownership confirmation are required';end if;
 end if;
 return new;
end $$;
create trigger creator_badge_requirements before update of verified,creator_type on profiles for each row execute function cw_badge_guard();
-- Save alerts are transactional and don't expose the visitor's identity.
create function public.cw_notify_project_save() returns trigger language plpgsql security definer set search_path=public as $$
declare owner_id uuid;app_name text;
begin
 select owner_user_id,title into owner_id,app_name from projects where slug=new.project_slug;
 if owner_id is not null and owner_id<>new.user_id and coalesce((select feedback_alerts from account_preferences where user_id=owner_id),true) then
  insert into notifications(user_id,kind,title,href) values(owner_id,'saved','Someone saved '||app_name,'/dashboard?view=creator');
 end if;return new;
end $$;
create trigger project_save_notification after insert on saved_projects for each row execute function cw_notify_project_save();
create function public.cw_notify_project_comment() returns trigger language plpgsql security definer set search_path=public as $$
declare owner_id uuid;app_name text;
begin
 if TG_OP='UPDATE' and (new.moderation_status<>'published' or old.moderation_status='published') then return new;end if;
 select owner_user_id,title into owner_id,app_name from projects where slug=new.project_slug;
 if owner_id is not null and owner_id is distinct from new.author_user_id and coalesce((select feedback_alerts from account_preferences where user_id=owner_id),true) then
  insert into notifications(user_id,kind,title,href) values(owner_id,'comment',case when new.moderation_status='published' then 'New published comment on ' else 'New comment awaiting review on ' end||app_name,'/dashboard/messages?project='||new.project_slug);
 end if;return new;
end $$;
create trigger project_comment_notification after insert or update of moderation_status on project_experiences for each row execute function cw_notify_project_comment();
revoke all on function cw_badge_progress(uuid),cw_badge_guard(),cw_notify_project_save(),cw_notify_project_comment() from public,anon,authenticated;
grant execute on function cw_badge_progress(uuid),cw_badge_guard(),cw_notify_project_save(),cw_notify_project_comment() to service_role;
commit;
