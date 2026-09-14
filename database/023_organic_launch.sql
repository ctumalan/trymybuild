-- Local only. Review, back up, and apply before deploying the matching launch UI.
-- Preserve all historical ledgers, grants, conversations, and existing queued requests.
begin;
set local lock_timeout='5s';
set local statement_timeout='60s';
alter table public.feedback_requests add column question text not null default '' check(length(question)<=300);

create function public.cw_launch_project_access(p_user uuid)
returns table(slots bigint,used bigint) language sql stable set search_path=public as $$
 select greatest(3,1+(select count(*) from project_slot_grants where user_id=p_user)),
 (select count(*) from projects where owner_user_id=p_user and listing_status in ('published','in_review'));
$$;
create or replace function public.cw_project_slot_guard() returns trigger language plpgsql set search_path=public as $$
declare allowance bigint; taken bigint;begin
 if new.listing_status not in ('published','in_review') or new.owner_user_id is null then return new;end if;
 perform pg_advisory_xact_lock(7112026);
 -- Editing an existing live/reviewed listing never consumes a second place.
 if tg_op='UPDATE' then
  if old.owner_user_id=new.owner_user_id and old.listing_status in ('published','in_review') then return new;end if;
 end if;
 select slots into allowance from cw_launch_project_access(new.owner_user_id);
 select count(*) into taken from projects where owner_user_id=new.owner_user_id and listing_status in ('published','in_review') and id<>new.id;
 if taken>=allowance then raise exception 'Your active project allowance is full. Unpublish a project or contact support; reviews are not required.';end if;
 insert into project_slot_assignments(project_id,user_id) values(new.id,new.owner_user_id) on conflict do nothing;return new;
end $$;

-- Refund only an actual outstanding reservation, never a free launch request.
create function public.cw_release_request_credit(p_user uuid,p_id uuid,p_event text) returns void language plpgsql set search_path=public as $$
begin
 perform pg_advisory_xact_lock(7112026);
 if (select coalesce(sum(amount),0) from credit_ledger where user_id=p_user and request_id=p_id)<0 then
  insert into credit_ledger(user_id,event_key,amount,reason,request_id) values(p_user,p_event||':'||p_id,1,'Reserved request credit returned',p_id) on conflict do nothing;
 end if;
end $$;
-- Return reservations for grandfathered queued requests without cancelling them.
do $$ declare r record;begin
 for r in select id,user_id from feedback_requests where status='queued' loop
  perform cw_release_request_credit(r.user_id,r.id,'launch-release');
 end loop;
end $$;

create function public.cw_launch_feedback_request(p_user uuid,p_id uuid,p_slug text,p_action text,p_question text) returns void language plpgsql set search_path=public as $$
declare req feedback_requests%rowtype;begin
 perform pg_advisory_xact_lock(7112026);
 if p_user is null or p_id is null or p_action is null or p_action not in ('create','cancel') or not exists(select 1 from users where id=p_user and account_status='active') then raise exception 'Not allowed';end if;
 select * into req from feedback_requests where id=p_id for update;
 if found then
  if req.user_id<>p_user or req.project_slug is distinct from p_slug then raise exception 'Request not found';end if;
  if p_action='create' then
   if req.question is distinct from trim(coalesce(p_question,'')) then raise exception 'Request conflict';end if;
   return;
  end if;
  if req.status='queued' then
   update feedback_requests set status='cancelled',updated_at=now() where id=p_id;
   perform cw_release_request_credit(p_user,p_id,'cancel');
  end if;return;
 end if;
 if p_action<>'create' then raise exception 'Request not found';end if;
 if p_question is null or length(trim(p_question)) not between 10 and 300 then raise exception 'Ask one specific question of 10–300 characters';end if;
 perform 1 from projects where slug=p_slug and owner_user_id=p_user and listing_status='published' for share;
 if not found then raise exception 'Choose your published project';end if;
 if exists(select 1 from feedback_requests where user_id=p_user and status='queued') then raise exception 'One open feedback request at a time. Cancel or finish your existing request first.';end if;
 insert into feedback_requests(id,user_id,project_slug,status,question) values(p_id,p_user,p_slug,'queued',trim(p_question));
end $$;
-- Old clients also use the no-charge path; never leave a paid back door active.
create or replace function public.cw_credit_request(p_user uuid,p_id uuid,p_slug text,p_action text) returns void language plpgsql set search_path=public as $$
declare question text;begin
 select r.question into question from feedback_requests r where r.id=p_id and r.user_id=p_user;
 perform cw_launch_feedback_request(p_user,p_id,p_slug,p_action,coalesce(question,'Was the first task clear, and what would make it easier?'));
end $$;

revoke all on function public.cw_launch_project_access(uuid),public.cw_release_request_credit(uuid,uuid,text),public.cw_launch_feedback_request(uuid,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.cw_launch_project_access(uuid),public.cw_launch_feedback_request(uuid,uuid,text,text,text),public.cw_release_request_credit(uuid,uuid,text) to service_role;

create or replace function public.cw_apply_qualification(p_feedback uuid) returns void language plpgsql set search_path=public as $$
declare q feedback_qualifications%rowtype; f creator_feedback%rowtype; req feedback_requests%rowtype; n integer; begin
 perform pg_advisory_xact_lock(7112026);
 select * into q from feedback_qualifications where feedback_id=p_feedback for update;
 select * into f from creator_feedback where id=p_feedback;
 if q.status='qualified' then
  insert into credit_ledger(user_id,event_key,amount,reason,feedback_id) values(q.user_id,'earn:'||p_feedback||':'||q.revision,1,'Qualifying feedback',p_feedback) on conflict do nothing;
  if not found then return;end if;
  select r.* into req from feedback_requests r join projects p on p.slug=r.project_slug where r.project_slug=q.project_slug and r.status='queued' and r.user_id<>q.user_id and p.owner_user_id=r.user_id and p.listing_status='published' and r.created_at<=f.created_at order by r.created_at,r.id limit 1 for update of r;
  if found and not exists(select 1 from feedback_requests where fulfilled_feedback_id=p_feedback) then
   update feedback_requests set status='fulfilled',fulfilled_feedback_id=p_feedback,updated_at=now() where id=req.id;
   insert into credit_ledger(user_id,event_key,amount,reason,feedback_id,request_id) values(req.user_id,'fulfilled:'||req.id,0,'Feedback request fulfilled',p_feedback,req.id);
   insert into notifications(user_id,kind,title,href) values(req.user_id,'credits','Your feedback request received a response','/dashboard/thread/'||p_feedback);
  end if;
  insert into notifications(user_id,kind,title,href) values(q.user_id,'credits','Thank you for sharing a firsthand experience with a creator.','/dashboard/community');
 end if;
end $$;

create or replace function public.cw_credit_review(p_actor uuid,p_feedback uuid,p_status text,p_reason text,p_revision integer) returns void language plpgsql set search_path=public as $$
declare q feedback_qualifications%rowtype; req feedback_requests%rowtype; reward integer; begin
 perform pg_advisory_xact_lock(7112026);
 if p_status not in ('qualified','rejected','revoked') or length(trim(p_reason)) not between 3 and 300 then raise exception 'Explain the decision'; end if;
 select * into q from feedback_qualifications where feedback_id=p_feedback for update;
 if not found or q.revision<>p_revision then raise exception 'Reload this review'; end if;
 if q.status=p_status then return;end if;
 if p_status='qualified' and exists(select 1 from creator_feedback where id=p_feedback and moderation_status='hidden') then raise exception 'Restore the feedback before awarding credit';end if;
 update feedback_qualifications set status=p_status,reason=trim(p_reason),reviewed_by=p_actor,revision=revision+1,updated_at=now() where feedback_id=p_feedback;
 if q.status='qualified' then
  select coalesce(sum(amount),0) into reward from credit_ledger where feedback_id=p_feedback and user_id=q.user_id;
  insert into credit_ledger(user_id,event_key,amount,reason,feedback_id) values(q.user_id,'reverse:'||p_feedback||':'||(q.revision+1),-reward,trim(p_reason),p_feedback);
  select * into req from feedback_requests where fulfilled_feedback_id=p_feedback and status='fulfilled' for update;
  if found then
   update feedback_requests set status='invalidated',updated_at=now() where id=req.id;
   perform cw_release_request_credit(req.user_id,req.id,'refund-invalid');
  end if;
 end if;
 update feedback_ratings set total=1,reason='Reward reset after moderation',updated_at=now() where feedback_id=p_feedback;
 if p_status='qualified' then perform cw_apply_qualification(p_feedback);end if;
 if p_actor is not null then insert into operations_log(actor_id,action,target_id,reason) values(p_actor,'credit-review.'||q.status||'.'||p_status,p_feedback,p_reason);end if;
 insert into notifications(user_id,kind,title,href) values(q.user_id,'credits','Feedback review: '||p_reason,'/dashboard/community');
end $$;

create or replace function public.cw_rate_feedback(p_actor uuid,p_feedback uuid,p_total integer,p_reason text,p_revision integer)
returns void language plpgsql set search_path=public as $$
declare f creator_feedback%rowtype; q feedback_qualifications%rowtype; r feedback_ratings%rowtype; earned integer; owner_id uuid; revision_now integer;
begin
 perform pg_advisory_xact_lock(7112026);
 if p_total is null or p_total not in (5,10) or p_reason is null or length(trim(p_reason)) not between 10 and 300 then raise exception 'Choose a rating and explain its impact';end if;
 select * into f from creator_feedback where id=p_feedback for update;
 if not found then raise exception 'Conversation not found';end if;
 select owner_user_id into owner_id from projects where slug=f.project_slug for share;
 if p_actor is null or p_actor is distinct from owner_id or p_actor=f.author_user_id or not exists(select 1 from users where id=p_actor and account_status='active') then raise exception 'Not allowed';end if;
 select * into q from feedback_qualifications where feedback_id=p_feedback for update;
 if not found or q.status<>'qualified' or f.moderation_status='hidden' then raise exception 'Only qualifying feedback can receive a bonus';end if;
 select * into r from feedback_ratings where feedback_id=p_feedback for update;
 revision_now=coalesce(r.revision,0);
 if revision_now is distinct from p_revision then raise exception 'Reload this conversation before rating again';end if;
 if r.total=p_total then return;end if;
 if coalesce(r.total,1)>p_total then raise exception 'Recognition can be upgraded, not withdrawn; report abuse for review';end if;
 if coalesce(r.total,1)=1 then
  if exists(select 1 from feedback_ratings where creator_user_id=p_actor and reviewer_user_id=f.author_user_id and feedback_id<>p_feedback and total>1 and created_at>now()-interval '30 days') then raise exception 'One bonus per creator pair every 30 days';end if;
  if (select count(*) from feedback_ratings where reviewer_user_id=f.author_user_id and total>1 and created_at>now()-interval '30 days')>=5 then raise exception 'Monthly bonus limit reached';end if;
 end if;
 insert into feedback_ratings(feedback_id,creator_user_id,reviewer_user_id,total,reason,revision)
 values(p_feedback,p_actor,f.author_user_id,p_total,trim(p_reason),revision_now+1)
 on conflict(feedback_id) do update set total=excluded.total,reason=excluded.reason,revision=excluded.revision,updated_at=now();
 select coalesce(sum(amount),0) into earned from credit_ledger where feedback_id=p_feedback and user_id=f.author_user_id;
 insert into credit_ledger(user_id,event_key,amount,reason,feedback_id) values(f.author_user_id,'recognition:'||p_feedback||':'||(revision_now+1),p_total-earned,trim(p_reason),p_feedback);
 insert into notifications(user_id,kind,title,href) values(f.author_user_id,'credits',case p_total when 5 then 'The creator found your feedback helpful.' else 'The creator said your feedback made a difference.' end,'/dashboard/messages?thread='||p_feedback);
 insert into operations_log(actor_id,target_id,action,reason) values(p_actor,p_feedback,'feedback.recognition.'||p_total,trim(p_reason));
end $$;

create or replace function public.cw_request_verification(p_user uuid,p_id uuid,p_subject text,p_message text,p_project text)
returns uuid language plpgsql set search_path=public as $$
declare progress record; existing support_cases%rowtype;
begin
 perform pg_advisory_xact_lock(7112026);
 if not exists(select 1 from users where id=p_user and account_status='active') then raise exception 'Active membership required';end if;
 select * into progress from cw_verification_progress(p_user);
 if progress.case_id is not null then return progress.case_id;end if;
 select * into existing from support_cases where id=p_id;
 if found then
  if existing.user_id=p_user and existing.kind='verification' then return existing.id;end if;
  raise exception 'Request ID already used';
 end if;
 if progress.verified then raise exception 'Already verified';end if;
 if not progress.has_published then raise exception 'Publish an approved project before requesting identity review';end if;
 if p_subject is null or length(trim(p_subject)) not between 3 and 120 or p_message is null or length(trim(p_message)) not between 10 and 4000 then raise exception 'Explain your identity and connection to your work';end if;
 if p_project is not null and not exists(select 1 from projects where slug=p_project and owner_user_id=p_user and listing_status='published') then raise exception 'Choose your published project';end if;
 insert into support_cases(id,user_id,kind,subject,message,project_slug)
 values(p_id,p_user,'verification',trim(p_subject),trim(p_message),p_project);
 return p_id;
end $$;
commit;
