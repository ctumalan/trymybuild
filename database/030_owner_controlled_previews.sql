-- Owner-controlled listing previews with provenance and a short rollback history.
begin;
alter table public.projects
  add column if not exists preview_source text not null default 'uploaded',
  add column if not exists preview_source_url text not null default '',
  add column if not exists preview_captured_at timestamptz,
  add column if not exists preview_history jsonb not null default '[]'::jsonb;

alter table public.projects drop constraint if exists projects_preview_source_check;
alter table public.projects add constraint projects_preview_source_check
  check (preview_source in ('uploaded','captured','studio'));
alter table public.projects drop constraint if exists projects_preview_history_check;
alter table public.projects add constraint projects_preview_history_check
  check (jsonb_typeof(preview_history) = 'array' and jsonb_array_length(preview_history) <= 3);

-- Existing member images are treated as owner uploads because that is the consent-safe default.
-- In-house catalog assets remain explicitly marked as Studio-managed.
update public.projects set preview_source='studio', preview_source_url=external_url
where is_studio=true and preview_path<>'';
commit;
