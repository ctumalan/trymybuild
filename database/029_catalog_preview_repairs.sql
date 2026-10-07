-- Keep launch-card previews on stable, versioned site assets.
update public.projects
set preview_path = '/assets/previews/codexnest.png',
    preview_public_url = '/assets/previews/codexnest.png'
where slug = 'codexnest-d43ff0';
