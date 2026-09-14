# Organic participation — approved launch direction

## Original local-only implementation checkpoint

The owner approved implementation on September 14, 2026 and explicitly prohibited pushing or publishing until other conversations finish. No commit, push, deployment, live migration, messages, or invitations are part of this change.

The owner subsequently authorized consolidation, commit, push, deployment, and publication on September 14. That authorization supersedes the original hold; current release state is recorded in `RELEASE_2026-09-14.md`. No messages or invitations are sent as part of publishing.

## Product decision

Lead with **give feedback / receive feedback**, not an earn-and-spend loop. Recognize real events: a reply, a creator finding feedback useful, or a feedback request receiving a response. No new activity is invented and positive reviews are not favored over useful criticism.

- Main community page, navigation, overview, review guidance, and membership copy de-emphasize credits and remove reward progress bars.
- The previous credit illustration remains in the repository unchanged but is no longer displayed in the active community page, because it teaches spending rules that do not apply during launch.
- Existing balances, contribution records, recognition and project grants are preserved. Credits remain available under an expandable history section; no cash value or future sponsor redemption is promised.
- New feedback requests cost no credits. Each asks one public-facing question of 10–300 characters; only verified owners of published projects can submit. One open request per creator, enforced transactionally. Existing multiple requests are grandfathered, not deleted.
- Default allowance: three projects published or awaiting review at once. Existing higher allowances remain. Unpublishing frees an active place; private drafts do not consume it. Qualifying feedback no longer issues additional slot grants. Server preflight and the database trigger use the same rule.
- Creator verification is a manual identity/ownership review available after an approved project is published. No 50-credit target; no automatic badge. Existing verified accounts and pending reviews remain intact.
- Historical queued credit reservations are returned once when migration 023 is applied. Cancelling or invalidating a new free request cannot mint a refund. Older fulfilled, charged requests retain the legitimate invalidation-refund path.

## Hands-on introductions, not a matching feature

Use existing Help & contact for inquiries; do not create an automated matching service, mailing list, public tester roster, or new rewards system.

1. **Tester opts in explicitly.** Ask which kinds of projects interest them, how much time they can offer, and whether they want an invitation. Selecting interests or browsing is not consent to outreach.
2. **Creator supplies a focused request.** Record the published project, intended audience, one small task, and one question. Encourage a task that a volunteer can reasonably try. Do not request passwords, real financial/health records, or other sensitive test data.
3. **Operator checks fit and access.** Confirm the project opens for the intended tester and that the request is appropriate. Propose a match only to a relevant volunteer; allow them to decline without penalties.
4. **Introduce with permission.** Prefer public project/profile links and existing private conversations. Ask both people before sharing email addresses or other contact details. No auto-enrollment, bulk invitations, or unsolicited follow-ups.
5. **Close the loop.** Encourage the creator to thank the tester and explain what they learned or changed. A response, match, or deadline is never guaranteed.
6. **Honor opt-out.** Record withdrawal in the existing support conversation and stop invitations. Keep only the minimum operational records, subject to existing privacy/deletion handling.

Before operating the beta, assign a named person responsible for introductions, moderation, and support. This implementation supplies explanatory copy and an inquiry route, not a promise that an introduction service is already staffed.

## Evidence to collect in the beta

With minimal, access-controlled records, track requests receiving substantive feedback, time to first response, whether creators found it actionable, declined introductions, and opt-outs. Ask a few participants where the process felt confusing. Do not treat comment volume or points as evidence of quality. Sponsor incentives can be tested later with separately approved, limited terms.

## Release prerequisite

At the original local checkpoint, `database/023_organic_launch.sql` was unapplied. The September 14 authorized release applied it after verifying a current backup and protected snapshot. Do not replay it. New application routes require its RPC and question column. Keep noindex and authentication/provider settings unchanged in this batch; see the release report for verification.

Other conversations had changes in app.js, community-entry.js, invitation rendering, listing flow and styles at the starting checkpoint. Their changes are preserved. Our overlap in app.js/community-entry.js is limited to participation copy; do not stage their files wholesale for an independent release without coordinating the combined diff.

## Local verification — September 14, 2026

- Type checking and production build passed.
- Full unit test snapshot: 194 tests, 193 passed. The remaining failure expects a sharing label in `tests/profile-community-polish.test.mjs`; sharing is being changed by another conversation. That unrelated assertion has not been rewritten to mask the mismatch.
- Disposable PostgreSQL-compatible database checks passed for migration 023: preserved balances and higher allowances, one-time reservation returns, free requests, ownership, retry conflicts, one-open-request enforcement, active-project limits, manual verification without points, and browser-role denial.
- Existing profile/community database checks passed, including guest claims, moderation notifications, public-only aggregates, private-message ownership, blocking, and account erasure.
- Whitespace/error checks passed. No live migration, push, or deployment was performed by this task. Other conversations remain active, so repeat combined checks before any coordinated release.
