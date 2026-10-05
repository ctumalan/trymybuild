-- Optional maker-to-maker exchanges. Apply after 027 before releasing the UI.
-- Existing listings, feedback, requests and credits are preserved.
begin;
set local lock_timeout='5s';
set local statement_timeout='60s';

create table public.maker_exchange_entries (
 request_id uuid primary key references public.feedback_requests(id) on delete cascade,
 user_id uuid not null references public.users(id),
 project_slug text not null references public.projects(slug),
 state text not null default 'waiting' check(state in ('waiting','matched','closed','cancelled')),
 partner_request_id uuid references public.maker_exchange_entries(request_id) on delete set null,
 given_feedback_id uuid references public.creator_feedback(id) on delete set null,
 joined_at timestamptz not null default now(),
 matched_at timestamptz,
 updated_at timestamptz not null default now(),
 check(partner_request_id is null or partner_request_id<>request_id)
);
create unique index maker_exchange_one_active on public.maker_exchange_entries(user_id) where state in ('waiting','matched');
create unique index maker_exchange_one_partner on public.maker_exchange_entries(partner_request_id) where partner_request_id is not null;
create index maker_exchange_waiting on public.maker_exchange_entries(joined_at,request_id) where state='waiting';
alter table public.maker_exchange_entries enable row level security;
revoke all on public.maker_exchange_entries from public,anon,authenticated;
grant select,insert,update,delete on public.maker_exchange_entries to service_role;

-- Server binds p_user to the authenticated active member, never a form field.
create function public.cw_join_maker_exchange(p_user uuid,p_id uuid,p_slug text,p_question text)
returns void language plpgsql set search_path=public as $$
declare current_entry maker_exchange_entries%rowtype; peer maker_exchange_entries%rowtype;begin
 perform pg_advisory_xact_lock(7112026);
 if p_user is null or p_id is null or not exists(select 1 from users where id=p_user and account_status='active') then raise exception 'Active membership required';end if;
 perform 1 from projects where slug=p_slug and owner_user_id=p_user and listing_status='published' and visibility='public' for share;
 if not found then raise exception 'Choose your published public project';end if;
 select * into current_entry from maker_exchange_entries where request_id=p_id for update;
 if found then
  if current_entry.user_id<>p_user or current_entry.project_slug is distinct from p_slug or not exists(select 1 from feedback_requests where id=p_id and question=trim(coalesce(p_question,''))) then raise exception 'Exchange request conflict';end if;
  if current_entry.state not in ('waiting','matched') then raise exception 'Start a new exchange request';end if;
  return; -- A retry cannot make another match or notification.
 end if;
 select * into current_entry from maker_exchange_entries where user_id=p_user and state in ('waiting','matched') for update;
 if found then
  if current_entry.given_feedback_id is not null and exists(select 1 from maker_exchange_entries where request_id=current_entry.partner_request_id and given_feedback_id is not null) then
   update maker_exchange_entries set state='closed',updated_at=now() where request_id in (current_entry.request_id,current_entry.partner_request_id);
  else raise exception 'Finish or leave your current exchange first';end if;
 end if;
 perform cw_launch_feedback_request(p_user,p_id,p_slug,'create',p_question);
 if not exists(select 1 from feedback_requests where id=p_id and status='queued') then raise exception 'Choose an open feedback request';end if;
 insert into maker_exchange_entries(request_id,user_id,project_slug) values(p_id,p_user,p_slug);
 select e.* into peer from maker_exchange_entries e
 join projects p on p.slug=e.project_slug join users u on u.id=e.user_id
 join feedback_requests r on r.id=e.request_id
 where e.state='waiting' and e.user_id<>p_user and u.account_status='active'
 and p.owner_user_id=e.user_id and p.listing_status='published' and p.visibility='public' and r.status in ('queued','fulfilled')
 -- Existing per-project reviews are unique: don't pair people who cannot give a new review.
 and not exists(select 1 from creator_feedback f where (f.author_user_id=p_user and f.project_slug=e.project_slug) or (f.author_user_id=e.user_id and f.project_slug=p_slug))
 order by e.joined_at,e.request_id limit 1 for update of e;
 if found then
  update maker_exchange_entries set state='matched',partner_request_id=peer.request_id,matched_at=now(),updated_at=now() where request_id=p_id;
  update maker_exchange_entries set state='matched',partner_request_id=p_id,matched_at=now(),updated_at=now() where request_id=peer.request_id;
  insert into notifications(user_id,kind,title,href) values
   (p_user,'feedback','Your maker feedback exchange is ready','/dashboard/exchange'),
   (peer.user_id,'feedback','Your maker feedback exchange is ready','/dashboard/exchange');
 end if;
end $$;

create function public.cw_leave_maker_exchange(p_user uuid,p_id uuid)
returns void language plpgsql set search_path=public as $$
declare entry maker_exchange_entries%rowtype; peer_user uuid;begin
 perform pg_advisory_xact_lock(7112026);
 select * into entry from maker_exchange_entries where request_id=p_id for update;
 if not found or p_user is null or entry.user_id<>p_user then raise exception 'Exchange not found';end if;
 if entry.state not in ('waiting','matched') then return;end if;
 select user_id into peer_user from maker_exchange_entries where request_id=entry.partner_request_id;
 -- Mark entries first so cancelling requests cannot recursively cancel the pair.
 update maker_exchange_entries set state='cancelled',updated_at=now() where request_id in (entry.request_id,entry.partner_request_id);
 update feedback_requests set status='cancelled',updated_at=now() where id in (entry.request_id,entry.partner_request_id) and status='queued';
 perform cw_release_request_credit(entry.user_id,entry.request_id,'exchange-cancel');
 if peer_user is not null then
  perform cw_release_request_credit(peer_user,entry.partner_request_id,'exchange-cancel');
  insert into notifications(user_id,kind,title,href) values(peer_user,'feedback','Your maker exchange ended. You can join another exchange.','/dashboard/exchange');
 end if;
end $$;

-- Only qualifying, self-reported firsthand feedback to the assigned maker counts.
-- Appeals and hidden/revoked feedback update progress instead of leaving false completions.
create function public.cw_sync_maker_exchange() returns trigger
language plpgsql set search_path=public as $$
declare f creator_feedback%rowtype; entry maker_exchange_entries%rowtype; peer maker_exchange_entries%rowtype;begin
 perform pg_advisory_xact_lock(7112026);
 select * into f from creator_feedback where id=new.feedback_id;
 if new.status<>'qualified' or f.moderation_status='hidden' or f.attempt is null or f.attempt='not_tried' then
  update maker_exchange_entries set given_feedback_id=null,updated_at=now() where given_feedback_id=new.feedback_id;
  return new;
 end if;
 select e.* into entry from maker_exchange_entries e join maker_exchange_entries other on other.request_id=e.partner_request_id
 where e.state='matched' and other.state='matched' and e.user_id=f.author_user_id and other.project_slug=f.project_slug
 and other.user_id=(select owner_user_id from projects where slug=f.project_slug)
 and f.created_at>=e.matched_at for update of e;
 if not found or entry.given_feedback_id is not null then return new;end if;
 update maker_exchange_entries set given_feedback_id=f.id,updated_at=now() where request_id=entry.request_id;
 select * into peer from maker_exchange_entries where request_id=entry.partner_request_id;
 if peer.given_feedback_id is not null then
  insert into notifications(user_id,kind,title,href) values
   (entry.user_id,'feedback','Both makers shared feedback. Your exchange is complete.','/dashboard/exchange'),
   (peer.user_id,'feedback','Both makers shared feedback. Your exchange is complete.','/dashboard/exchange');
 end if;
 return new;
end $$;
create trigger maker_exchange_feedback after insert or update of status on public.feedback_qualifications
 for each row execute function public.cw_sync_maker_exchange();

-- Cancelling a request, unpublishing an app or disabling an account ends its exchange.
create function public.cw_stop_unavailable_exchange() returns trigger
language plpgsql set search_path=public as $$
declare entry record;begin
 if tg_table_name='feedback_requests' then
  if new.status='cancelled' then
   for entry in select user_id,request_id from maker_exchange_entries where request_id=new.id and state in ('waiting','matched') loop perform cw_leave_maker_exchange(entry.user_id,entry.request_id);end loop;
  end if;
 elsif tg_table_name='projects' then
  if new.listing_status<>'published' or new.visibility<>'public' or new.owner_user_id is distinct from old.owner_user_id then
   for entry in select user_id,request_id from maker_exchange_entries where project_slug=new.slug and state in ('waiting','matched') loop perform cw_leave_maker_exchange(entry.user_id,entry.request_id);end loop;
  end if;
 elsif tg_table_name='users' and new.account_status<>'active' then
  for entry in select user_id,request_id from maker_exchange_entries where user_id=new.id and state in ('waiting','matched') loop perform cw_leave_maker_exchange(entry.user_id,entry.request_id);end loop;
 end if;
 return new;
end $$;
create trigger maker_exchange_request_cancel after update of status on public.feedback_requests for each row execute function public.cw_stop_unavailable_exchange();
create trigger maker_exchange_project_unavailable after update of listing_status,visibility,owner_user_id on public.projects for each row execute function public.cw_stop_unavailable_exchange();
create trigger maker_exchange_member_unavailable after update of account_status on public.users for each row execute function public.cw_stop_unavailable_exchange();

create function public.cw_delete_maker_exchange_entry() returns trigger language plpgsql set search_path=public as $$
declare peer maker_exchange_entries%rowtype;begin
 perform pg_advisory_xact_lock(7112026);
 select * into peer from maker_exchange_entries where request_id=old.partner_request_id;
 if old.state='matched' and peer.state='matched' then
  update maker_exchange_entries set state='cancelled',updated_at=now() where request_id=peer.request_id;
  update feedback_requests set status='cancelled',updated_at=now() where id=peer.request_id and status='queued';
  perform cw_release_request_credit(peer.user_id,peer.request_id,'exchange-cancel');
  insert into notifications(user_id,kind,title,href) values(peer.user_id,'feedback','Your maker exchange ended. You can join another exchange.','/dashboard/exchange');
 end if;
 return old;
end $$;
create trigger maker_exchange_entry_deleted before delete on public.maker_exchange_entries for each row execute function public.cw_delete_maker_exchange_entry();

create function public.cw_maker_exchange_state(p_user uuid) returns jsonb
language plpgsql stable set search_path=public as $$
declare entry maker_exchange_entries%rowtype; peer maker_exchange_entries%rowtype; details jsonb;begin
 if p_user is null or not exists(select 1 from users where id=p_user and account_status='active') then raise exception 'Active membership required';end if;
 select * into entry from maker_exchange_entries where user_id=p_user order by joined_at desc,request_id desc limit 1;
 if not found then return null;end if;
 select * into peer from maker_exchange_entries where request_id=entry.partner_request_id;
 select jsonb_build_object('slug',p.slug,'title',p.title,'question',r.question,'task',p.first_try,'maker',coalesce(pr.display_name,'Another maker')) into details
 from projects p join feedback_requests r on r.id=peer.request_id left join profiles pr on pr.user_id=peer.user_id
 where p.slug=peer.project_slug and p.owner_user_id=peer.user_id and p.listing_status='published' and p.visibility='public'
 and exists(select 1 from users where id=peer.user_id and account_status='active');
 return jsonb_build_object('id',entry.request_id,'project',entry.project_slug,'state',entry.state,'complete',entry.given_feedback_id is not null and peer.given_feedback_id is not null,
 'given',entry.given_feedback_id,'received',peer.given_feedback_id,'partner',details,'joinedAt',entry.joined_at);
end $$;

revoke all on function public.cw_join_maker_exchange(uuid,uuid,text,text),public.cw_leave_maker_exchange(uuid,uuid),public.cw_sync_maker_exchange(),public.cw_stop_unavailable_exchange(),public.cw_delete_maker_exchange_entry(),public.cw_maker_exchange_state(uuid) from public,anon,authenticated;
grant execute on function public.cw_join_maker_exchange(uuid,uuid,text,text),public.cw_leave_maker_exchange(uuid,uuid),public.cw_sync_maker_exchange(),public.cw_stop_unavailable_exchange(),public.cw_delete_maker_exchange_entry(),public.cw_maker_exchange_state(uuid) to service_role;
commit;
