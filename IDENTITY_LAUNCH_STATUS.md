# CreatorWorks identity launch status

The site now runs on Astro with server routes and is published for testing at https://creatorworks.vercel.app. The eleven fictional display profiles remain clearly labeled Demo. They do not have passwords, email addresses, WorkOS IDs, sessions, or administrator permissions.

Separate Vercel and WorkOS staging resources and a separate free Supabase project have been created. See PROVIDER_RESOURCES.md for exact identifiers. Database tables and eleven catalog records are installed. OAuth callback and sign-out addresses are configured. With the founder's approval, credentials were transferred directly to protected Vercel settings without displaying values. The hosted configuration checks now pass for authentication and database access; real-user sign-in remains to be tested.

The implementation includes OAuth state and PKCE checks, sealed sessions, same-origin write checks, private-by-default editable profiles, public profile routes, per-member saved projects, and authenticated feedback submitted for review. A genuine sign-in must still be tested after credentials are configured.

## To make browsing available on other computers

Browsing is available at https://creatorworks.vercel.app. Deployment was performed directly to the separate CreatorWorks project. A reviewed Git checkpoint is still needed; exclude the two Claude prompt files and preserve concurrent work.

The hosted site runs server routes, not only a static preview. Its sign-in link reaches the separate CreatorWorks AuthKit application.

## To make sign-in work

Follow IDENTITY_ARCHITECTURE.md: migrate to Astro server rendering, use a separate CreatorWorks WorkOS/AuthKit configuration, and create a separate database. Implement sign-in, callback, sign-out, encrypted sessions, profiles, ownership authorization, and server-backed saves and feedback. New genuine signups should become members automatically, without a founder allowlist. Administrator authority stays server-controlled.

Configure email sign-in and optionally Google in WorkOS. Use `http://localhost:4321/auth/callback` for local staging and `https://<confirmed-domain>/auth/callback` for production. Production sign-out returns to `https://<confirmed-domain>/`.

Required configuration names: `PUBLIC_APP_URL`, `WORKOS_CLIENT_ID`, `WORKOS_REDIRECT_URI`, `SESSION_COOKIE_NAME` (`cw_session`), `SUPABASE_URL`, `SUPABASE_AVATAR_BUCKET` (`profile-avatars`), `WORKOS_API_KEY`, `WORKOS_COOKIE_PASSWORD`, `SUPABASE_SERVICE_ROLE_KEY`, `FOUNDER_WORKOS_USER_ID`. Values belong in provider settings, never in this document or browser code.

## Demo profiles and real accounts

Keep the eleven display personas out of production WorkOS. They are design fixtures, not proof of adoption. Use controlled test inboxes and staging WorkOS only if authentication testing later needs multiple actual test accounts. Do not send invitations to invented addresses.

Before public launch, either remove the personas and display the actual in-house creator, or retain clear demo labels. Never count demo profiles, reviews, or activity toward adoption, ratings, verified status, or rankings. A real creator can claim a project only after an authorized ownership review.

## Remaining founder participation

The founder has signed into the provider dashboards and approved credential transfer. The founder must now sign into CreatorWorks once to establish their real identity. End-to-end sign-in and profile persistence still require verification. WorkOS is currently staging, and paid upgrades require a separate choice. Supabase displays an organization-level usage warning; no paid upgrade was made.
