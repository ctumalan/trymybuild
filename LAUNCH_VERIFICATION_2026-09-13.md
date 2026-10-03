# Launch verification — September 13, 2026

Status: **incomplete; public launch remains on hold**. This is a verification checkpoint, not a release or security certification.

Source reviewed: main `93b44a6`, application release `51cddac`. No application code, provider settings, DNS, production records, credentials, or indexing settings were changed. No accounts, comments, messages, wishes, or invitations were submitted. This report is the only new repository file.

## Passed in this session

- All 185 application tests pass; type checking and production build pass.
- Live home, Terms, Privacy, and health routes return 200. The public catalog is connected and returns 11 projects.
- Enforced Content-Security-Policy is present on the live homepage and sampled server routes. The second-opinion claim that CSP is absent is incorrect.
- Anonymous account export and Community credits return 401; administrator workspace returns 403.
- Real Chrome inspection: catalog loads; project drawer opens with invitation-led layout, preview, Try action, and inline comment field. Standard project drawer Escape dismissal returns focus to its opener after the closing transition.
- Responsive checks at measured 390 CSS-pixel width: project drawer and creator listing form have no page-level horizontal overflow in the sampled states. Creator form images have no observed broken-image failures. This is not a full mobile/accessibility audit.
- Invitation preview loads project-specific content and canonical recipient link; Send invitation opens Email, Text, Copy invitation, and More options. No external handoff or sending was performed.
- Creator tab contains the listing form and does not include the misplaced category conversation section.
- Temporary browser viewport override was reset after testing.
- Public DNS has Zoho MX, SPF, and DKIM records. These do not prove actual delivery.

## Confirmed unresolved findings

| Item | Current evidence | Completion criterion |
|---|---|---|
| Project access | Unsigned GET: AfterSchool Together 200; StackScout, GameGrid, LessonLab, CartCompare, PocketBalance, DayFrame, MealMap, HomeRhythm, PackLight, BriefBuilder all 401, title “Sign in required.” | Owner chooses intended audience; each intended launch app works for an unrelated intended user. Do not infer that any free ChatGPT account has access from a 401 alone. |
| Authentication environment | `/auth/sign-in` redirects through WorkOS to `tasteful-beginning-71-staging.authkit.app`. | Reviewed production transition with existing identity/ownership continuity, followed by genuine signup, verification, recovery, and logout tests. No credential swap without a migration plan. |
| Search discovery | Homepage has `noindex, nofollow`; robots.txt and sitemap.xml return 404. | After launch authorization, allow indexing only for public routes and verify sitemap/canonical URLs. Keep private routes excluded. |
| Email policy | `_dmarc.trymybuild.com` TXT lookup returns ENODATA. | Approve reporting destination/policy, publish and verify it, then perform controlled send/receive tests. |
| Nested-dialog keyboard handling | Open AfterSchool Together details, then Share, then press Escape once. After transition, the underlying project drawer disappears while the native invitation dialog remains open; focus falls to BODY. Reproduced in live Chrome. | Escape closes only the topmost dialog and returns focus to its connected opener; a subsequent Escape closes the project drawer. Test both loading and loaded invitation states. |

The nested-dialog issue is consistent with `app.js`'s keydown handler ignoring only `.cw-overlay[open]`, not the native `.invitation-dialog[open]`; it handles/prevents Escape while `share-invitation.js` relies on native dialog cancellation. Diagnosis only; no fix applied in this verification task.

## Still requires user participation or provider verification

- Two controlled email addresses for separate creator/reviewer test accounts. Do not use founder data for destructive tests; passwords and one-time codes remain private. Account creation/terms acceptance and permanent deletion require appropriate confirmation or handoff.
- Full two-person rehearsal: signup and email verification; create draft; upload preview; submit and approve; public listing/profile; share; qualifying feedback/credit; reply; notifications; guest comment and optional signup claim; private message; block/report; export; deletion of the explicitly disposable test identity.
- Actual phone/keyboard/screen-reader coverage beyond the sampled narrow layouts, including authenticated dashboards and credit illustration placement.
- Fresh mailbox send/receive and password-recovery delivery. DNS alone is insufficient.
- Isolated restore rehearsal including uploaded files, backup retention, alert delivery, cost limits, and named moderation/support/incident owner. September 12's verified database backup, private snapshots, and deployment rollback reference remain prior evidence; they are not a completed image/storage restore drill.
- Owner/policy review of Terms, Privacy, age/acceptance flow, and public founder/operator naming. No legal clearance is claimed.

## Next decisions requested

1. Which two controlled email addresses should be used for the test accounts?
2. Should the ten restricted launch apps open without signing in, or intentionally require an account?

Provider changes, public-access changes, actual test-data submissions, and the indexing cutover are not authorized by this read-only checkpoint. Obtain the relevant approval at the point of action. Do not announce launch until blockers and rehearsal outcomes are resolved and recorded.
