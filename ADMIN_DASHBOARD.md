# CreatorWorks administration — first release

Private route: `/admin`. Every page and mutation checks the authenticated WorkOS user against the exact server-only `FOUNDER_WORKOS_USER_ID`. Missing configuration denies access. Names, emails, verification badges, browser state, and self-selected profile labels never grant access. This first release uses that environment assignment as founder authority; it does not infer admin rights from the legacy database role field.

## Included

- Real account, project, and pending-comment counts.
- Paginated comment queues: pending, published, hidden.
- Publish, hide, or return a comment to review, with confirmation and a required reason.
- Atomic comment decision and activity insertion through `cw_review_comment`; stale text/status is rejected.
- Read-only paginated member profiles and project inventory.
- Existing in-house verification explanation and review activity history.

## Activation

September 5, 2026: dashboard code deployed to CreatorWorks. Anonymous production checks returned `/admin` 401, review POST 403, and homepage 200. Local type checks, seven tests, and production build passed. The user confirmed their exact WorkOS account ID; founder authority is configured in production. Signed-in browser verification successfully loaded the admin overview (1 account, 11 project records, 1 pending comment). Migration 002 is still unapplied: Supabase requires sign-in. Live moderation and activity history remain pending database setup and end-to-end verification.

1. Apply `database/002_admin_review.sql` only to the separate CreatorWorks database (nkrkmfszuntvzjonrznb).
2. Founder signs into CreatorWorks and opens `/admin`. When unconfigured, that page shows only the current account's WorkOS ID and email.
3. Founder confirms that exact identity; set `FOUNDER_WORKOS_USER_ID` in CreatorWorks Vercel production settings, then redeploy. Never use a display-name match or automatically grant the first account admin.
4. Test ordinary-member denial and a real pending-comment decision with founder approval.

No existing comment, account, or catalog record is altered during setup. No destructive deletion, mass actions, or role editor is provided.

## Not yet implemented

Account suspension/restoration, project publishing/hiding/category editing, ownership assignment, granting/revoking general creator verification, avatar uploads, and expanded profile editing. Public project listing remains code-backed, so database visibility changes would not alone hide a public catalog entry. Connect the catalog to authoritative server data before adding those controls. This is not a completed full-platform administration suite.

Review notes and history are admin-only. Comment publication exposes the contribution and its author's display name. No new paid resources or Producer Studio access is required.
