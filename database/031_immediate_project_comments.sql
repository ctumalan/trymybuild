-- Publish new guest project comments immediately. Existing moderation controls
-- remain available to hide or remove comments after publication.
begin;
set local lock_timeout='5s';
set local statement_timeout='60s';

create or replace function public.cw_submit_guest_comment(p_id uuid,p_slug text,p_hash text,p_message text) returns uuid
language plpgsql security definer set search_path=public as $$
declare existing project_experiences%rowtype;
begin
 if p_id is null or p_hash is null or p_hash !~ '^[a-f0-9]{64}$' or p_message is null or length(p_message)>800 or cw_wish_words(p_message) not between 7 and 150 then raise exception 'Invalid comment';end if;
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

revoke all on function public.cw_submit_guest_comment(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.cw_submit_guest_comment(uuid,text,text,text) to service_role;
commit;
