# Account & security — release status

## Scope

Dashboard `/dashboard/security` retains the account sidebar. It displays the WorkOS account email and current session's sign-in method (not a claim to list every linked method). Profile editing remains separate. Email changes, MFA/passkey enrollment, and instant account deletion are not implemented.

- Password-authenticated sessions can request the WorkOS password-reset email. Google/GitHub sessions get provider security links. No password or reset token is returned to the browser or logged. WorkOS email delivery and hosted reset URL must be checked before release; custom-email configurations may need additional setup.
- Current-browser logout uses the existing route. All-session logout lists the authenticated user's sessions across pages and revokes active ones. Partial failures are not reported as success. Existing access tokens can remain valid until expiry; this is disclosed.
- Deletion is a reviewed request, not automatic erasure. A separate AuthKit login challenge must return as the same account, followed by a five-minute signed confirmation and typed DELETE. Founder requests are blocked server-side. Other users can request/cancel; requests appear at `/admin/account-requests` behind the founder guard.
- No project, profile, feedback, image, or WorkOS user is deleted by this feature. The final deletion/retention policy and execution workflow remain explicitly deferred; administrator review must resolve ownership and shared conversations with the requester.

## Deployment gate

User approved proceeding on 2026-09-06 and subsequently explicitly requested release. The successful backup at `/Users/ctdevelopermac/creatorworks-backups/creatorworks_pre_migration_20260906T210344Z.dump` supersedes the earlier empty-file blocker. Archive inspection confirmed six public tables, schema/access-control entries, and counts of 11 projects, 2 users, 2 profiles, and 1 experience. This is not a tested restoration. SHA-256: `85ca0ad9a7f4daddcf97172e4546d2eb3eb64c09bde37a5861f2ad524dfc2a72`.

Migrations 002–007 were applied together in one transaction to verified CreatorWorks project `nkrkmfszuntvzjonrznb` on 2026-09-07 UTC (2026-09-06 Pacific). The SQL editor reported commit success. Post-checks confirmed all original record counts preserved, 11 published owned projects, six new RLS-protected tables, and one private preview bucket. Existing rate-limit functions/table were preserved. Released to https://creatorworks.vercel.app with live read-only checks passed; see `RELEASE_2026-09-06.md` for details and remaining end-to-end tests.

No real password-reset emails, session revocations, reauthentication flows, or deletion requests were executed during development. No credentials were changed. Tests use fixtures and source checks, not production accounts.

## Verification before enabling publicly

1. Complete the approved CreatorWorks backup/migration release, including separate approval for 007.
2. Verify password email delivery and completion with a consenting password test account, never the founder's credentials.
3. Verify Google session shows provider guidance, not a local-password reset button.
4. Verify revoke-all with two consenting test sessions and document token-expiry behavior.
5. Verify deletion challenge cannot be completed by a different account; confirm expiration/tampering are rejected.
6. Verify request/cancellation persistence, administrator-only queue, and founder protection with real database permissions.

Provider references: https://workos.com/docs/reference/authkit/password-reset and https://workos.com/docs/authkit/custom-emails
