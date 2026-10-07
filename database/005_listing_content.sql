-- CreatorWorks 005: authoritative listing content + publication lifecycle.
-- Additive and idempotent. Apply ONLY to the separate CreatorWorks database (ref nkrkmfszuntvzjonrznb).
-- No rows are deleted. Existing owners, visibility, and ownership_status are preserved except where
-- this migration intentionally fills the eleven in-house records below.
begin;

alter table public.projects
  add column if not exists category text not null default '',
  add column if not exists summary text not null default '',
  add column if not exists tagline text not null default '',
  add column if not exists headline text not null default '',
  add column if not exists help_text text not null default '',
  add column if not exists first_try text not null default '',
  add column if not exists purpose text not null default '',
  add column if not exists audience text not null default '',
  add column if not exists stage text not null default '',
  add column if not exists price_label text not null default 'Free',
  add column if not exists is_free boolean not null default true,
  add column if not exists external_url text not null default '',
  add column if not exists link_note text not null default '',
  add column if not exists outcome text not null default '',
  add column if not exists note text not null default '',
  add column if not exists preview_path text not null default '',
  add column if not exists preview_public_url text not null default '',
  add column if not exists benefits jsonb not null default '[]'::jsonb,
  add column if not exists access_note text not null default '',
  add column if not exists creator_slug text not null default '',
  add column if not exists is_studio boolean not null default false,
  add column if not exists listing_status text not null default 'draft',
  add column if not exists client_token text,
  add column if not exists lock_version integer not null default 0,
  add column if not exists submitted_at timestamptz,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists published_at timestamptz;

-- Publication lifecycle: draft (owner only) → in_review (submitted) → published (public) → unpublished.
alter table public.projects drop constraint if exists projects_listing_status_check;
alter table public.projects add constraint projects_listing_status_check
  check (listing_status in ('draft','in_review','published','unpublished'));

create index if not exists projects_status_idx on public.projects(listing_status, updated_at desc);
create index if not exists projects_owner_idx on public.projects(owner_user_id);
-- Idempotent creation: one (owner, client_token) maps to exactly one project, so a retried "create"
-- returns the same row instead of making a duplicate, and two different tokens make two drafts.
create unique index if not exists projects_owner_token_idx on public.projects(owner_user_id, client_token)
  where client_token is not null and client_token <> '';

-- Fill the eleven approved in-house records with their exact live presentation content.
-- (Generated from app.js. Rows already exist from 001, so these are UPDATEs.)
-- RERUN SAFETY: each UPDATE is guarded by coalesce(headline,'')='' so it only fills a row that has NOT
-- been given content yet. Re-running this migration after any later edit — or after a project was
-- intentionally unpublished — is a no-op for that row: it never overwrites edits and never republishes.
update public.projects set
  title='AfterSchool Together', category='Family life', summary='Find out whether one adult can actually make every after-school trip.',
  tagline='A calmer school week', headline='Check your children’s activities against the trips and travel times you enter.', help_text='Spot overlapping trips before you’re trying to be in two places at once.', first_try='Add a day of activities and review the pickup plan.',
  purpose='Turns a week of children''s activities into the drop-offs and pickups it really requires, then checks them against your own travel times.', audience='Parents coordinating several children''s activities', stage='New',
  price_label='Free', is_free=true,
  external_url='projects/afterschool-together/index.html', link_note='Opens here on CreatorWorks', outcome='Check whether your week''s drop-offs and pickups actually work', note='Made in-house by the CreatorWorks team. This is a new listing and community evidence has not been collected yet. It works entirely in your browser: no account, no cloud sync, and no maps or live traffic — travel times are the ones you enter.',
  preview_path='/assets/previews/afterschooltogether.png', preview_public_url='/assets/previews/afterschooltogether.png',
  benefits='["Turn a week of activities into actual trips","See which trips one adult cannot make","Leave with a daily driver plan you can share"]'::jsonb, access_note='No sign-in needed to try it',
  creator_slug='creatorworks-studio', is_studio=true,
  listing_status='published', visibility='public', ownership_status='verified',
  published_at=coalesce(published_at, now()), updated_at=now()
 where slug='afterschooltogether' and coalesce(headline,'')='';
update public.projects set
  title='StackScout', category='Technology', summary='Compare technology choices without drowning in technical language.',
  tagline='Make sense of your options', headline='Choose less. Ship sooner.', help_text='Understand the tradeoffs without getting lost in technical language.', first_try='Compare a few options for something you want to build.',
  purpose='Helps you narrow down the right tools for a project by comparing what matters most.', audience='People choosing technology for a new idea', stage='New',
  price_label='Free', is_free=true,
  external_url='https://stack-scout-cw.tumalanct.chatgpt.site', link_note='', outcome='Choose a practical technology direction', note='This is a new CreatorWorks listing. Community evidence has not been collected yet.',
  preview_path='/assets/previews/stackscout.png', preview_public_url='/assets/previews/stackscout.png',
  benefits='["Compare choices side by side","Focus on the tradeoffs that matter","Leave with a practical direction"]'::jsonb, access_note='Opens a separate site; sign-in may be required',
  creator_slug='creatorworks-studio', is_studio=true,
  listing_status='published', visibility='public', ownership_status='verified',
  published_at=coalesce(published_at, now()), updated_at=now()
 where slug='stackscout' and coalesce(headline,'')='';
update public.projects set
  title='GameGrid', category='Sports & teams', summary='Turn scattered game details into one clear team schedule.',
  tagline='Everyone on the same page', headline='Organize games, practices, times, and locations.', help_text='Keep team details in one place instead of scattered messages.', first_try='Add your team’s next practice and game.',
  purpose='Keeps practices, games, locations, and team plans together so fewer details get lost.', audience='Coaches, players, and team organizers', stage='New',
  price_label='Free', is_free=true,
  external_url='https://game-grid-cw.tumalanct.chatgpt.site', link_note='', outcome='Build and review a sports schedule', note='This is a new CreatorWorks listing. Community evidence has not been collected yet.',
  preview_path='/assets/previews/gamegrid.png', preview_public_url='/assets/previews/gamegrid.png',
  benefits='["Keep games and practices together","Make locations easier to find","Give the whole team one clear schedule"]'::jsonb, access_note='Opens a separate site; sign-in may be required',
  creator_slug='creatorworks-studio', is_studio=true,
  listing_status='published', visibility='public', ownership_status='verified',
  published_at=coalesce(published_at, now()), updated_at=now()
 where slug='gamegrid' and coalesce(headline,'')='';
update public.projects set
  title='LessonLab', category='Teaching & learning', summary='Build a balanced lesson around the time you actually have.',
  tagline='More room to teach', headline='Arrange lesson activities into a timed plan.', help_text='See how the lesson fits together before you start teaching.', first_try='Plan one lesson with an opening, activity, and close.',
  purpose='Helps teachers shape a lesson with a clear beginning, activity, and close.', audience='Teachers, tutors, and workshop leaders', stage='New',
  price_label='Free', is_free=true,
  external_url='https://lesson-lab-cw.tumalanct.chatgpt.site', link_note='', outcome='Create a timed lesson plan', note='This is a new CreatorWorks listing. Community evidence has not been collected yet.',
  preview_path='/assets/previews/lessonlab.png', preview_public_url='/assets/previews/lessonlab.png',
  benefits='["Plan around the time you have","Balance the lesson from start to finish","Leave with a timed lesson plan"]'::jsonb, access_note='Opens a separate site; sign-in may be required',
  creator_slug='creatorworks-studio', is_studio=true,
  listing_status='published', visibility='public', ownership_status='verified',
  published_at=coalesce(published_at, now()), updated_at=now()
 where slug='lessonlab' and coalesce(headline,'')='';
update public.projects set
  title='CartCompare', category='Shopping', summary='Compare what purchases really cost before you decide.',
  tagline='A clearer buying decision', headline='Compare prices and practical differences between purchases.', help_text='Make a decision with the important details side by side.', first_try='Add two options you’re considering and compare them.',
  purpose='Places prices and practical differences side by side for a calmer buying decision.', audience='Anyone comparing products or shopping options', stage='New',
  price_label='Free', is_free=true,
  external_url='https://cart-compare-cw.tumalanct.chatgpt.site', link_note='', outcome='Compare the true cost of several choices', note='This is a new CreatorWorks listing. Community evidence has not been collected yet.',
  preview_path='/assets/previews/cartcompare.png', preview_public_url='/assets/previews/cartcompare.png',
  benefits='["See options side by side","Compare the true cost","Make a calmer buying decision"]'::jsonb, access_note='Opens a separate site; sign-in may be required',
  creator_slug='creatorworks-studio', is_studio=true,
  listing_status='published', visibility='public', ownership_status='verified',
  published_at=coalesce(published_at, now()), updated_at=now()
 where slug='cartcompare' and coalesce(headline,'')='';
update public.projects set
  title='PocketBalance', category='Money', summary='See your month clearly without building a complicated budget.',
  tagline='A clearer month ahead', headline='Organize monthly income and expenses into a simple snapshot.', help_text='See where your money goes without building a complicated spreadsheet.', first_try='Enter example income and expenses to explore a month.',
  purpose='Creates a simple snapshot of money coming in, going out, and remaining.', audience='People who want a gentler view of monthly finances', stage='New',
  price_label='Free', is_free=true,
  external_url='https://pocket-balance-cw.tumalanct.chatgpt.site', link_note='', outcome='Create a monthly financial snapshot', note='This is a new CreatorWorks listing. Community evidence has not been collected yet.',
  preview_path='/assets/previews/pocketbalance.png', preview_public_url='/assets/previews/pocketbalance.png',
  benefits='["See money in and money out","Understand what remains this month","Get a simple financial snapshot"]'::jsonb, access_note='Opens a separate site; sign-in may be required',
  creator_slug='creatorworks-studio', is_studio=true,
  listing_status='published', visibility='public', ownership_status='verified',
  published_at=coalesce(published_at, now()), updated_at=now()
 where slug='pocketbalance' and coalesce(headline,'')='';
update public.projects set
  title='DayFrame', category='Personal planning', summary='Plan a day that respects your actual time and energy.',
  tagline='A little room to breathe', headline='Arrange tasks into a daily plan around your available time.', help_text='Notice an overloaded day before you commit to everything.', first_try='Add a few tasks and shape a plan for today.',
  purpose='Turns a long task list into a realistic daily plan with room to breathe.', audience='Busy people who want a more realistic day', stage='New',
  price_label='Free', is_free=true,
  external_url='https://day-frame-cw.tumalanct.chatgpt.site', link_note='', outcome='Shape a realistic plan for today', note='This is a new CreatorWorks listing. Community evidence has not been collected yet.',
  preview_path='/assets/previews/dayframe.png', preview_public_url='/assets/previews/dayframe.png',
  benefits='["Turn tasks into a realistic day","Plan around your available energy","Leave room to breathe"]'::jsonb, access_note='Opens a separate site; sign-in may be required',
  creator_slug='creatorworks-studio', is_studio=true,
  listing_status='published', visibility='public', ownership_status='verified',
  published_at=coalesce(published_at, now()), updated_at=now()
 where slug='dayframe' and coalesce(headline,'')='';
update public.projects set
  title='MealMap', category='Food & home', summary='Make a practical weeknight meal plan from what works for you.',
  tagline='Less “what’s for dinner?”', headline='Organize your dinners and estimate their cost.', help_text='Make fewer last-minute dinner decisions and keep your budget in sight.', first_try='Add a few meals and see how your plan adds up.',
  purpose='Reduces the daily question of what to cook by mapping meals across the week.', audience='Households planning everyday meals', stage='New',
  price_label='Free', is_free=true,
  external_url='https://meal-map-cw.tumalanct.chatgpt.site', link_note='', outcome='Create a weeknight meal plan', note='This is a new CreatorWorks listing. Community evidence has not been collected yet.',
  preview_path='/assets/previews/mealmap.png', preview_public_url='/assets/previews/mealmap.png',
  benefits='["Map meals across the week","Reduce daily dinner decisions","Build a practical weeknight plan"]'::jsonb, access_note='ChatGPT sign-in required',
  creator_slug='creatorworks-studio', is_studio=true,
  listing_status='published', visibility='public', ownership_status='verified',
  published_at=coalesce(published_at, now()), updated_at=now()
 where slug='mealmap' and coalesce(headline,'')='';
update public.projects set
  title='HomeRhythm', category='Food & home', summary='Keep small home-maintenance jobs from becoming big surprises.',
  tagline='Stay ahead of the little jobs', headline='Organize recurring household tasks into a schedule.', help_text='Keep track of routine care without relying on memory.', first_try='Add a few maintenance jobs you want to remember.',
  purpose='Organizes recurring household care into a schedule you can actually follow.', audience='Renters and homeowners managing a household', stage='New',
  price_label='Free', is_free=true,
  external_url='https://home-rhythm-cw.tumalanct.chatgpt.site', link_note='', outcome='Build a home-maintenance rhythm', note='This is a new CreatorWorks listing. Community evidence has not been collected yet.',
  preview_path='/assets/previews/homerhythm.png', preview_public_url='/assets/previews/homerhythm.png',
  benefits='["Organize recurring home care","See what needs attention next","Keep small jobs from becoming surprises"]'::jsonb, access_note='Opens a separate site; sign-in may be required',
  creator_slug='creatorworks-studio', is_studio=true,
  listing_status='published', visibility='public', ownership_status='verified',
  published_at=coalesce(published_at, now()), updated_at=now()
 where slug='homerhythm' and coalesce(headline,'')='';
update public.projects set
  title='PackLight', category='Travel', summary='Pack for a trip without carrying your whole closet.',
  tagline='Less to carry', headline='Build a carry-on list around your trip and activities.', help_text='Keep packing focused on what you need.', first_try='Make a list for your next weekend away.',
  purpose='Builds a focused carry-on list around the trip, weather, and activities.', audience='Travelers who want to pack lighter', stage='New',
  price_label='Free', is_free=true,
  external_url='https://pack-light-cw.tumalanct.chatgpt.site', link_note='', outcome='Create a practical carry-on list', note='This is a new CreatorWorks listing. Community evidence has not been collected yet.',
  preview_path='/assets/previews/packlight.png', preview_public_url='/assets/previews/packlight.png',
  benefits='["Plan around your trip and weather","Pack for the activities ahead","Build a focused carry-on list"]'::jsonb, access_note='Opens a separate site; sign-in may be required',
  creator_slug='creatorworks-studio', is_studio=true,
  listing_status='published', visibility='public', ownership_status='verified',
  published_at=coalesce(published_at, now()), updated_at=now()
 where slug='packlight' and coalesce(headline,'')='';
update public.projects set
  title='BriefBuilder', category='Creative work', summary='Turn a loose idea into a brief another person can understand.',
  tagline='Give your idea a clear direction', headline='Organize a creative idea’s purpose, audience, and direction.', help_text='Help someone else understand what you want to make.', first_try='Describe one idea and shape it into a brief.',
  purpose='Guides creative thoughts into a clear purpose, audience, and direction.', audience='Creators, freelancers, and small teams', stage='New',
  price_label='Free', is_free=true,
  external_url='https://brief-builder-cw.tumalanct.chatgpt.site', link_note='', outcome='Create a focused creative brief', note='This is a new CreatorWorks listing. Community evidence has not been collected yet.',
  preview_path='/assets/previews/briefbuilder.png', preview_public_url='/assets/previews/briefbuilder.png',
  benefits='["Clarify the purpose of your idea","Name the audience it should reach","Create a brief others can understand"]'::jsonb, access_note='Opens a separate site; sign-in may be required',
  creator_slug='creatorworks-studio', is_studio=true,
  listing_status='published', visibility='public', ownership_status='verified',
  published_at=coalesce(published_at, now()), updated_at=now()
 where slug='briefbuilder' and coalesce(headline,'')='';

commit;
