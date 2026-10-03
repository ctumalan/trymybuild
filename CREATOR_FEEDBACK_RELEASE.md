# Tell the creator — September 6, 2026

## Experience

- `/tell/{slug}` for all eleven current catalog projects. Actual project link, preview, usefulness, separate pricing opinion, optional message, explicit public/private choice.
- `/dashboard`: visitor saved projects and feedback history.
- `/dashboard?view=creator`: server-owned projects, per-project inbox, page-scoped usefulness/pricing counts, shareable feedback link.
- `/dashboard/thread/{id}`: persistent participant-only replies, whether original feedback is private or public. No email notifications in this release.
- `/admin/feedback`: founder-only public feedback moderation and audit history. Existing admin dashboard remains intact.
- One account can use both member views. Neither the creator view nor a public identity label grants administrator powers.

## Privacy and authority

All writes require authenticated WorkOS identity and same-origin requests. Creator access follows `projects.owner_user_id`, not a caller-supplied user ID, display name, or badge. Feedback thread reads and replies require exact authorship/ownership. SQL checks reply ownership again inside the transaction and restricts browser DB access with RLS and revoked grants. Original feedback is immutable in this version: one initial response per visitor/project; follow-ups go in the conversation. Own-project reviews are blocked. Duplicate initial submits open the existing thread; reply request IDs avoid duplicate sends and SQL throttles rapid repeats.

Public page selects only explicitly public, published feedback. Private records never enter the moderation queue; the SQL review function rejects attempts to publish them. Public feedback carries the contributor's display name with explicit disclosure before sending; private profiles are not otherwise published. Follow-up replies are participant-only. Administrator/service operators retain safety/support access to database records, disclosed in the UI. Pricing sentiment is not a quality score or purchase verification.

## Activation still needed

The Supabase tab currently requires sign-in. Apply `003_creator_feedback.sql` to CreatorWorks project `nkrkmfszuntvzjonrznb`, then `004_launch_creator_ownership.sql` to attach only the eleven unassigned in-house projects to the exact founder account the user confirmed. Existing owners are preserved. No role assignments or Producer Studio resources change. Prior `002_admin_review.sql` is also still pending for the older comment queue.

Until activation, submission is explicitly unavailable, not silently stored in browser storage. The pages and dashboard navigation may be assessed, but persistence and live replies cannot be claimed tested yet.

## Validation

Published to `https://creatorworks.vercel.app` as deployment `creatorworks-80p6ez2vq-christian-s-team3.vercel.app`. The step-2 wording correction from the concurrent listing task was retained. Local HTTP checks returned 200 for public feedback pages, 404 for an unknown project, 401 for unsigned member dashboards/threads, and 403 for unsigned admin access and foreign-origin writes. Database activation remains pending; publication is not evidence of working persistent feedback.

Local type checks, policy/security tests and all-eleven-project presentation tests pass. Database assertions in tests inspect migration safeguards; they are not a substitute for executing PostgreSQL or live two-account testing. After database activation, verify creator vs unrelated-user isolation, private non-disclosure, public moderation, reply persistence, duplicate sends and ordinary-user admin denial using separate consenting test accounts. Do not publish fabricated user feedback for testing.

## Boundaries

The catalog and creator onboarding remain the existing code-backed prototype. New project publishing/ownership approval, general verification management, email notifications, subscriptions, editing/withdrawing initial feedback, and attachments are not implemented by this change. Visitor saved sidebar shows latest 50; feedback/replies paginate 25 per page. Existing comment records are preserved separately, not silently migrated into this new privacy model.
