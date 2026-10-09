-- Launch writing policy: accept nonempty comments, feedback, replies and wishes.
-- Preserve identities, visibility, moderation, idempotency and submission limits.
begin;
set local lock_timeout='5s';
set local statement_timeout='60s';
alter table public.project_experiences drop constraint project_experiences_response_check;
alter table public.project_experiences add constraint project_experiences_response_check check(length(trim(response))>0);
alter table public.creator_feedback drop constraint creator_feedback_message_check;
alter table public.feedback_replies drop constraint feedback_replies_message_check;
alter table public.feedback_replies add constraint feedback_replies_message_check check(length(trim(message))>0);
alter table public.daily_discussion_comments drop constraint daily_discussion_comments_message_check;
alter table public.daily_discussion_comments add constraint daily_discussion_comments_message_check check(length(trim(message))>0);
alter table public.community_wishes drop constraint community_wishes_description_check;
alter table public.community_wishes add constraint community_wishes_description_check check(length(trim(description))>0);
-- A digest keeps long descriptions out of the unique index; the RPC still checks
-- exact description equality under the member lock before inserting.
alter table public.community_wishes drop constraint community_wishes_user_id_category_description_key;
create function public.cw_wish_description_hash(p_text text) returns bytea language sql immutable strict as $$
 select sha256(convert_to(p_text,'UTF8'));
$$;
revoke all on function public.cw_wish_description_hash(text) from public,anon,authenticated;
grant execute on function public.cw_wish_description_hash(text) to service_role;
create unique index community_wishes_description_identity on public.community_wishes(user_id,category,cw_wish_description_hash(description));

create or replace function public.cw_comment_guard() returns trigger language plpgsql set search_path=public as $$
declare msg text; begin
 if tg_table_name='project_experiences' then msg=new.response; else msg=new.message; end if;
 if msg is null or length(trim(msg))=0 then raise exception 'Write a message.';end if;
 return new;
end $$;

create or replace function public.cw_feedback_reply(p_actor uuid,p_id uuid,p_message text,p_request uuid)
returns void language plpgsql security invoker set search_path=public as $$
declare item public.creator_feedback%rowtype; owner_id uuid;
begin
 if p_message is null or length(trim(p_message))=0 or p_request is null then raise exception 'Invalid reply'; end if;
 select * into item from public.creator_feedback where id=p_id for update;
 if not found then raise exception 'Not found'; end if;
 select owner_user_id into owner_id from public.projects where slug=item.project_slug for share;
 if p_actor is null or (p_actor is distinct from item.author_user_id and p_actor is distinct from owner_id) then raise exception 'Not allowed'; end if;
 if exists(select 1 from public.feedback_replies where request_id=p_request and author_user_id=p_actor and feedback_id=p_id) then return; end if;
 if exists(select 1 from public.feedback_replies where feedback_id=p_id and author_user_id=p_actor and created_at>now()-interval '10 seconds') then raise exception 'Please wait before replying again'; end if;
 insert into public.feedback_replies(feedback_id,author_user_id,message,request_id) values(p_id,p_actor,trim(p_message),p_request);
end; $$;

create or replace function public.cw_submit_guest_comment(p_id uuid,p_slug text,p_hash text,p_message text) returns uuid
language plpgsql security definer set search_path=public as $$
declare existing project_experiences%rowtype;
begin
 if p_id is null or p_hash is null or p_hash !~ '^[a-f0-9]{64}$' or p_message is null or length(trim(p_message))=0 then raise exception 'Invalid comment';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_hash,0));
 perform 1 from projects where slug=p_slug and listing_status='published' for share;
 if not found then raise exception 'Project unavailable';end if;
 select * into existing from project_experiences where id=p_id or (project_slug=p_slug and guest_hash=p_hash) limit 1;
 if found then
  if existing.guest_hash=p_hash and existing.project_slug=p_slug then
   if existing.id=p_id and existing.response<>trim(p_message) then raise exception 'Request conflict';end if;
   return existing.id;
  end if;
  raise exception 'Request conflict';
 end if;
 if (select count(*) from project_experiences where guest_hash=p_hash)>=5 then raise exception 'Guest limit reached';end if;
 insert into project_experiences(id,project_slug,response,guest_hash,guest_expires_at,moderation_status)
 values(p_id,p_slug,trim(p_message),p_hash,now()+interval '7 days','published');
 return p_id;
end $$;

create or replace function public.cw_submit_wish(p_user uuid,p_category text,p_description text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare existing community_wishes%rowtype; wish_id uuid;
begin
 -- Lock the member, not a count result: parallel submissions cannot exceed the cap.
 perform 1 from users where id=p_user and account_status='active' for update;
 if not found then raise exception 'Active account required';end if;
 if p_category is null or length(trim(p_category)) not between 2 and 48 or p_description is null or length(trim(p_description))=0 then raise exception 'Invalid wish';end if;
 select * into existing from community_wishes where user_id=p_user and category=p_category and description=trim(p_description);
 if found then return jsonb_build_object('outcome','duplicate','status',existing.moderation_status);end if;
 if (select count(*) from community_wishes where user_id=p_user and moderation_status in ('pending','published'))>=10 then return jsonb_build_object('outcome','limit');end if;
 insert into community_wishes(user_id,category,description) values(p_user,p_category,trim(p_description)) returning id into wish_id;
 return jsonb_build_object('outcome','submitted','status','pending');
end $$;

commit;
