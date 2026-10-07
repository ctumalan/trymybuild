-- Count real community reviews separately from public comments. Administrator
-- reviews, removed feedback and responses from people who did not try the app do
-- not dismiss the first-review invitation.
begin;
set local lock_timeout='5s';
set local statement_timeout='60s';

drop function if exists public.cw_public_activity();
create function public.cw_public_activity()
returns table(slug text,comments bigint,recent_comments bigint,saved bigint,community_reviews bigint)
language sql stable security definer set search_path=public as $$
 select p.slug,
  count(c.created_at),
  count(c.created_at) filter(where c.created_at>=now()-interval '30 days'),
  (select count(*) from saved_projects s where s.project_slug=p.slug),
  (select count(*) from creator_feedback f
   join users u on u.id=f.author_user_id
   where f.project_slug=p.slug
    and f.moderation_status<>'hidden'
    and f.attempt<>'not_tried'
    and u.system_role<>'admin'
    and u.account_status='active')
 from projects p left join lateral(
  select created_at from project_experiences where project_slug=p.slug and moderation_status='published'
  union all select created_at from creator_feedback where project_slug=p.slug and visibility='public' and moderation_status='published'
 ) c on true where p.listing_status='published' group by p.slug;
$$;

revoke all on function public.cw_public_activity() from public,anon,authenticated;
grant execute on function public.cw_public_activity() to service_role;
commit;
