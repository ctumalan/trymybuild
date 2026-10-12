-- Private admin-prepared previews. No project or creator account exists until a
-- verified recipient explicitly claims one; claiming always creates a private draft.
begin;
set local lock_timeout='5s';
set local statement_timeout='60s';
create table if not exists public.listing_invitations (
 id uuid primary key default gen_random_uuid(),
 created_by uuid not null references public.users(id),
 recipient_email text not null check (length(recipient_email) between 3 and 254 and recipient_email=lower(trim(recipient_email))),
 title text not null, external_url text not null,
 category text not null default '', stage text not null default 'Ready for a first try',
 summary text not null default '', headline text not null default '',
 help_text text not null default '', first_try text not null default '',
 price_label text not null default 'Free', is_free boolean not null default true,
 video_url text not null default '', preview_path text not null default '',
 preview_source text not null default 'uploaded' check (preview_source in ('uploaded','captured')),
 preview_source_url text not null default '', preview_captured_at timestamptz,
 lock_version integer not null default 0,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 expires_at timestamptz not null default (now()+interval '30 days'), revoked_at timestamptz,
 claimed_by uuid references public.users(id), claimed_at timestamptz,
 project_id uuid references public.projects(id) on delete set null,
 check ((claimed_by is null and claimed_at is null) or (claimed_by is not null and claimed_at is not null))
);
alter table public.listing_invitations enable row level security;
revoke all on public.listing_invitations from public,anon,authenticated;
grant select,insert,update on public.listing_invitations to service_role;
create index if not exists listing_invitations_created on public.listing_invitations(created_at desc);

create or replace function public.cw_claim_listing_invitation(p_id uuid,p_member uuid,p_email text,p_version integer,p_content jsonb)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare invite public.listing_invitations%rowtype; project public.projects%rowtype; pid uuid; project_slug text;
begin
 -- Serializes retries and races with administrator edits/revocation.
 select * into invite from listing_invitations where id=p_id for update;
 if not found or invite.recipient_email is distinct from lower(trim(p_email)) then raise exception 'Invitation unavailable';end if;
 perform 1 from users where id=p_member and account_status='active' for update;
 if not found then raise exception 'Active account required';end if;
 if invite.claimed_by is not null then
  if invite.claimed_by<>p_member then raise exception 'Already claimed';end if;
  select * into project from projects where id=invite.project_id and owner_user_id=p_member;
  if not found then raise exception 'Claimed draft removed';end if;
  return to_jsonb(project);
 end if;
 if invite.revoked_at is not null or invite.expires_at<=now() or invite.lock_version is distinct from p_version then raise exception 'Invitation changed or expired';end if;
 if jsonb_typeof(p_content) is distinct from 'object'
  or length(trim(coalesce(p_content->>'title',''))) not between 1 and 80
  or length(coalesce(p_content->>'external_url','')) not between 8 and 2000
  or (p_content->>'external_url') !~ '^https?://'
  or length(coalesce(p_content->>'category',''))>48
  or length(coalesce(p_content->>'headline',''))>140
  or length(coalesce(p_content->>'summary',''))>160
  or length(coalesce(p_content->>'help_text',''))>500
  or length(coalesce(p_content->>'first_try',''))>500 then raise exception 'Invalid app details';end if;
 pid=gen_random_uuid();
 project_slug='app-'||replace(pid::text,'-','');
 insert into projects(id,slug,owner_user_id,title,external_url,category,stage,summary,headline,help_text,first_try,
  price_label,is_free,video_url,preview_path,preview_public_url,preview_source,preview_source_url,preview_captured_at,
  visibility,listing_status,sharing_preference,ownership_status,is_studio,client_token)
 values(pid,project_slug,p_member,trim(p_content->>'title'),p_content->>'external_url',coalesce(p_content->>'category',''),
  coalesce(p_content->>'stage','Ready for a first try'),coalesce(p_content->>'summary',''),coalesce(p_content->>'headline',''),
  coalesce(p_content->>'help_text',''),coalesce(p_content->>'first_try',''),coalesce(p_content->>'price_label',invite.price_label),
  coalesce((p_content->>'is_free')::boolean,invite.is_free),coalesce(p_content->>'video_url',''),invite.preview_path,
  case when invite.preview_path<>'' then '/api/project-image/'||project_slug else '' end,
  invite.preview_source,invite.preview_source_url,invite.preview_captured_at,
  'draft','draft','private','unverified',false,'invitation-'||invite.id::text)
 returning * into project;
 update listing_invitations set claimed_by=p_member,claimed_at=now(),project_id=pid,lock_version=lock_version+1,updated_at=now() where id=p_id;
 return to_jsonb(project);
end $$;
revoke all on function public.cw_claim_listing_invitation(uuid,uuid,text,integer,jsonb) from public,anon,authenticated;
grant execute on function public.cw_claim_listing_invitation(uuid,uuid,text,integer,jsonb) to service_role;
commit;
