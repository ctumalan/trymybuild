# CreatorWorks provider resource inventory

Created during this setup on September 4, 2026. Identifiers below are not secrets.

- Vercel project: `creatorworks`
- Vercel team: `christian-s-team3`
- Vercel project ID: `prj_juKQHNOZiMyxCIufITAvivwQ50vm`
- Hosted test site: `https://creatorworks.vercel.app`
- WorkOS project: `CreatorWorks` (created from scratch; staging only)
- New WorkOS staging environment: `environment_01M1Q45NY0B0H1MXQHX5JXEMRJ`
- New WorkOS default application: `app_01M1Q45PN1NCTV0SEV52JBDA9K`
- New WorkOS client ID: `client_01M1Q45PBXXP060946GCNPSJDP`

WorkOS automatically named the new default app after the account organization; it has now been renamed `CreatorWorks Web`. It is inside the NEW CreatorWorks environment above, not the existing Producer Studio app.

- Supabase project: `creatorworks`
- Supabase project reference: `nkrkmfszuntvzjonrznb`
- Supabase URL: `https://nkrkmfszuntvzjonrznb.supabase.co`
- Region: West US (Oregon), `us-west-2`
- Plan: existing Tumalan Music Free organization; no upgrade enabled
- Schema `database/001_identity.sql` applied successfully; eleven projects seeded, zero fictional authentication accounts
- WorkOS callbacks: `https://creatorworks.vercel.app/auth/callback`, `http://localhost:4321/auth/callback`
- WorkOS sign-out return: `https://creatorworks.vercel.app/`

The Supabase organization showed 5.65 / 5 GB bandwidth use before this project's creation and displays an over-limit notice. Review its existing allowance before a broader launch.

For comparison only, the pre-existing Producer Studio environment is `environment_01KZP4KXMWWNV8TSGJS7TJVJQP`. Do not modify or use its credentials.

No WorkOS production environment or paid upgrade was created. The hosted test site will use staging AuthKit until a production plan is explicitly chosen.
