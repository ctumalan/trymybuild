# TryMyBuild domain transition

## Completed and verified
- Domain registered: trymybuild.com, Vercel; expires September 8, 2027. Renewal quote $11.25; auto-renew state not verified after the user's checkout.
- Existing Vercel project renamed to trymybuild, same project ID prj_juKQHNOZiMyxCIufITAvivwQ50vm, scope christian-s-team3.
- Existing GitHub repository renamed to https://github.com/ctumalan/trymybuild; local origin updated. No replacement repository or database created.
- WorkOS application renamed TryMyBuild Web; client remains client_01M1Q45PBXXP060946GCNPSJDP, app app_01M1Q45PN1NCTV0SEV52JBDA9K, environment environment_01M1Q45NY0B0H1MXQHX5JXEMRJ (Staging).
- Added callback https://trymybuild.com/auth/callback and sign-out https://trymybuild.com/. Existing addresses retained.
- Production PUBLIC_APP_URL=https://trymybuild.com and WORKOS_REDIRECT_URI=https://trymybuild.com/auth/callback updated without reading or changing secrets.
- Commit 05be2ab deployed as dpl_DyCSm3Cmszw5zusquM61oyrL1qzN. 103 tests and type checks passed; production build succeeded.
- HTTPS root and catalog returned 200; legacy root returned 307 to new domain. Live sign-in uses the matching client and new callback. Full authenticated sign-in/sign-out still requires a user-driven test.
- www.trymybuild.com attached to the production project after initial alias-only access was protected; final HTTP verification follows.

## Remaining launch work — not completed
- Zoho free business mailbox registration requires user password entry and acceptance of terms. Setup page: https://workplace.zoho.com/signup?type=org&plan=free. Planned address hello@trymybuild.com. No mailbox or email DNS records created yet.
- Verify domain ownership in Zoho; add provider-issued MX, SPF, DKIM, and appropriate DMARC records; test receiving and sending. Do not invent validation tokens or DKIM values.
- Rename Google Analytics property and stream while retaining measurement ID/history; update stream website URL. Dashboard not yet inspected.
- Rename WorkOS project/visible hosted-auth branding and Supabase project display name; preserve environment/client/project identifiers and data.
- Finish documentation/display-label sweep. Preserve historical records, stable stored identifiers, legacy links and local draft keys unless a compatibility migration is implemented. Local workspace directory remains CreatorWorks.
- Vercel configuration still contains noindex/nofollow. Search-engine launch is not complete; review public indexing separately from private-account routes.
- Verify GitHub/Vercel Git integration still tracks the renamed repository. Manual deployment verified; automatic deployment integration not yet checked.

## Safety and continuity
- No database migration or data deletion during this domain transition.
- Legacy/API requests and in-flight OAuth callbacks are not blindly redirected. New navigation moves to the new origin; browser-local drafts and sessions do not automatically transfer across domains.
- Do not claim the entire public launch complete until email, remaining provider branding, and end-to-end checks are complete.
