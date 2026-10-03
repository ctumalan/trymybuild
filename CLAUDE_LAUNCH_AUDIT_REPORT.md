# TryMyBuild — Independent Launch Readiness Audit

- **Auditor:** Claude (independent review), commissioned via `CLAUDE_LAUNCH_AUDIT_BRIEF.md`
- **Date:** 2026-09-11
- **Workspace:** `/Users/ctdevelopermac/Developer/CreatorWorks` — confirmed `origin = github.com/ctumalan/trymybuild`, branch `main`, HEAD `4542803` (matches brief's release-record commit; `e90043b` present).
- **Live target:** https://trymybuild.com · **Supabase:** `nkrkmfszuntvzjonrznb` · **WorkOS client:** `client_01M1Q45PBXXP060946GCNPSJDP`
- **Method:** static code review (all `src/pages/**`, `src/server/**`, `app.js` + client scripts, 18 SQL migrations, config), local automation (149 tests, typecheck, build), public HTTP/DNS/TLS checks, and non-mutating live navigation. Three independent review passes plus first-hand verification of the top findings.
- **Uncommitted work preserved:** `index.html` + `tests/branding.test.mjs` (approved slogan "Apps that make everyday life easier." — local only, not published). No application/production changes were made. Only this report file was created.

---

## 1. Executive verdict — **HOLD the public announcement** (a gated soft launch is possible after 3 blockers are fixed)

TryMyBuild is a genuinely well-built application. The security fundamentals that usually sink small launches are, for the most part, done correctly: PKCE+state OAuth, sealed httpOnly session cookies, same-origin CSRF checks on every write, session-derived ownership (no IDOR), a thoroughly-hardened SSRF preview capture, server-side image re-encoding, and Row-Level Security that grants only the service role on every table. 149 tests, type-check, and production build all pass. That is real, credit-worthy engineering.

However, **it is not ready for a public launch announcement today** because of three issues, each independently sufficient to hold:

1. **BLOCKER — Stored XSS in the public catalog.** A creator-controlled project **title/summary** is rendered into the catalog with `innerHTML` **without escaping** (the detail view escapes the same fields; the catalog list does not). Storage does no sanitization, and there is **no Content-Security-Policy**. A published listing can run attacker JavaScript on `trymybuild.com` for every visitor. (Verified first-hand.)
2. **BLOCKER — Production identity runs on WorkOS *staging*.** `https://trymybuild.com/auth/sign-in` redirects to `tasteful-beginning-71-staging.authkit.app` — the hosted sign-in is a **staging** environment. Shipping real users through a staging identity environment is a data/reliability/branding risk. (Verified via public redirect chain, no credentials.)
3. **BLOCKER (for an *announcement*) — The whole site is `noindex, nofollow` with no robots.txt/sitemap.** `vercel.json` applies `X-Robots-Tag: noindex,nofollow` to `/(.*)`. Correct for a pre-launch state, but an announcement whose purpose is discovery cannot succeed while the site forbids indexing. (Verified live.)

Beyond those, one HIGH content-safety gap (community **wishes have no moderation or takedown path** and publish publicly and instantly) and privacy-copy inaccuracies should be resolved before inviting the public.

**Recommendation:** Fix B1–B3 (all low-effort) + H1–H3, then do a **conditional soft launch** to a controlled audience, and only announce broadly after an authenticated end-to-end pass (signup → publish → feedback → credits → notifications → deletion) has actually been exercised with disposable test accounts — which this audit was not authorized to run.

---

## 2. Prioritized findings

Each: **ID · severity · persona/journey · observed → expected · impact · environment · repro · evidence · confidence · fix + verification.**

### BLOCKERS

#### B1 — Stored XSS via unescaped project title/summary in the public catalog
- **Persona/journey:** any visitor browsing the catalog / home; attacker = any email-verified creator.
- **Observed:** `app.js` `productCard()` renders `` <strong>${product.name}</strong> `` and `` <p>${product.summary}</p> `` and `catalogRow()` renders `` <button class="row-title" …>${product.name}</button> `` / `` <p>${product.summary}</p> `` with **no `esc()`**, then injects the string via `innerHTML`. The **detail drawer escapes the same fields** (`esc(product.name)`, `esc(copy[...])`) — an inconsistent-escaping bug.
- **Expected:** all creator-controlled strings escaped before HTML interpolation, as the detail view already does.
- **Impact:** a creator sets a **title** (validated only by length ≤80 via `listing-policy.mjs` `text()`, *not* the 4–10-word rule) or **summary** to e.g. `<img src=x onerror=…>`; it is stored raw, passes founder review (a legitimacy check, not sanitization), and then executes JS on the `trymybuild.com` origin for **every catalog visitor**. `cw_session` is httpOnly (blunts cookie theft) but attacker JS can still issue same-origin authenticated API calls (CSRF `sameOrigin` passes), exfiltrate page data, deface, or phish. No CSP to contain it.
- **Environment:** deployed `main` (`4542803`) + local; code-verified.
- **Repro (static):** compare `app.js:~226` (`<strong>${product.name}</strong>`, `<p>${product.summary}</p>`) and `app.js:~383` (catalogRow) against `detailDrawer` (`app.js:~490`) which uses `esc(...)`; storage sanitization absent in `src/server/listing-policy.mjs:55-56` (`text`/`paragraph` only trim/slice); served raw by `src/server/catalog-db.ts` `toClientProject` → `src/pages/api/catalog.ts`.
- **Evidence:** `app.js` `productCard` (line ~218) and `catalogRow` (line ~380); `src/server/listing-policy.mjs:55-56`; `src/server/catalog-db.ts:56-86`.
- **Confidence:** High (verified first-hand).
- **Fix:** wrap `product.name`/`product.summary` (and the `alt=`/`aria-label=` uses that still interpolate raw `product.name`) in `esc()` in `productCard`/`catalogRow`; audit `app.js` for every raw `product.*`/`state.selected.*` interpolation (also `feedbackPage` ~594, `${project.name}` ~576). Add a Content-Security-Policy (see H4). **Verify:** create a local fixture listing with `<img src=x onerror=…>` in title, render the catalog, confirm it displays inert text; add a regression test asserting escaped output.

#### B2 — Production site authenticates against the WorkOS **staging** environment
- **Persona/journey:** every user who signs in / signs up.
- **Observed:** `GET https://trymybuild.com/auth/sign-in` → `https://api.workos.com/user_management/authorize?...client_id=client_01M1Q45PBXXP060946GCNPSJDP&redirect_uri=https://trymybuild.com/auth/callback` → **`https://tasteful-beginning-71-staging.authkit.app`**. The hosted AuthKit domain is a staging environment (`-staging`), and the `client_id` matches the staging client recorded in `PROVIDER_RESOURCES.md` ("hosted test site will use staging AuthKit until a production plan is explicitly chosen").
- **Expected:** production traffic on a WorkOS **production** environment with a custom/production AuthKit domain, production redirect allowlist, and production branding.
- **Impact:** staging environments are not intended for production load; can carry test-mode limits/branding, separate user pools, and weaker guarantees. Migrating environments later changes identifiers and can disrupt existing users — cheaper to fix before launch than after.
- **Environment:** live, verified via public redirect chain (no credentials used).
- **Repro:** `curl -s -o /dev/null -w '%{redirect_url}' https://trymybuild.com/auth/sign-in`, then follow that URL one hop.
- **Evidence:** redirect host `tasteful-beginning-71-staging.authkit.app`; `src/server/auth.ts` (WorkOS client wiring); `PROVIDER_RESOURCES.md`.
- **Confidence:** High that it is staging; **owner must confirm** intent in the WorkOS dashboard.
- **Fix (owner):** stand up the WorkOS **production** environment; set production redirect URIs (`https://trymybuild.com/auth/callback`), sign-out returns, hosted branding/custom domain; move `WORKOS_*` production secrets into Vercel. **Verify:** sign-in redirects to a production AuthKit domain; a disposable account completes signup + email verification.

#### B3 — Entire site is de-indexed; no robots.txt or sitemap (blocks a discovery-driven announcement)
- **Persona/journey:** search/discovery; anyone finding the site organically or via shared links.
- **Observed:** live root and all asset/API responses carry `X-Robots-Tag: noindex, nofollow` (`vercel.json` header rule on `/(.*)`); `feedback-ui.ts` also adds a `<meta name="robots" content="noindex">` to legal pages; `robots.txt` → **404**; `sitemap.xml` → **404** (`scripts/prepare-site.mjs` generates neither).
- **Expected (for a public launch):** public pages indexable; `robots.txt` + `sitemap.xml` present; private/dashboard/admin routes remain noindex.
- **Impact:** an announcement that relies on people finding TryMyBuild cannot work while every page tells crawlers to stay out and shared links won't accrue SEO. (If the plan is invite-only/soft launch, this is *not* a blocker — confirm intent.)
- **Environment:** live + config, verified.
- **Repro:** `curl -sI https://trymybuild.com/ | grep x-robots`; `curl -sI https://trymybuild.com/robots.txt` → 404.
- **Evidence:** `vercel.json:5`; `src/server/feedback-ui.ts` (meta noindex on policy surfaces); `scripts/prepare-site.mjs` (no robots/sitemap).
- **Confidence:** High.
- **Fix:** scope `noindex` to private routes only (drop the global `vercel.json` rule; set noindex per-route for `/dashboard/**`, `/admin/**`, `/api/**`); add `robots.txt` (+ sitemap of public catalog/project/profile URLs). **Verify:** root returns no `X-Robots-Tag`; `robots.txt`/`sitemap.xml` 200; dashboard/admin still noindex.

### HIGH

#### H1 — Community **wishes** have no moderation, no takedown, and publish publicly & instantly
- **Persona/journey:** any visitor reads wishes on the home/community view; any verified member posts them.
- **Observed:** `database/016_community_wishes.sql` has **no `moderation_status`**; `src/pages/api/wishes.ts` GET returns all wishes to everyone (including anonymous); the only removal path is full account deletion (FK cascade / delete trigger). `admin/community.ts` moderates credits + daily discussion but **not wishes**. By contrast, feedback and daily comments *do* have `moderation_status` + admin review.
- **Impact:** harassment, PII, defamation, or spam in a 4–11-word wish goes live to all visitors with no way to hide/remove it short of deleting the author's account. For a public community launch this is a real content-safety and legal-exposure gap.
- **Evidence:** `database/016_community_wishes.sql:3-10,14-22`; `src/pages/api/wishes.ts:11-13`; `community-entry.js:85,122-124`; `src/pages/admin/community.ts`.
- **Confidence:** High (code-cited).
- **Fix:** add `moderation_status` to `community_wishes`, gate the public GET on it (or add a report/hide flow), and add an admin hide/remove control. **Verify:** post a wish, hide it via admin, confirm it disappears from the public list without deleting the account.

#### H2 — Privacy Policy contradicts the interest profile the product actually builds
- **Persona/journey:** any signing-up user; regulatory/trust.
- **Observed:** `src/pages/privacy.ts` states *"We do not ask you to create an interest profile manually,"* and `src/pages/dashboard/[section].ts:30` says *"You never need to type an interest list."* But signup shows interest **checkboxes** (`community-entry.js:78`, hint "Click as many as you want"), POSTs them to `/api/onboarding` (`community-entry.js:100`), stores them in `account_preferences.interests` (`src/pages/api/onboarding.ts:17`), and uses them for "New in your interests" notifications (`src/server/notifications.ts:31`).
- **Impact:** an inaccurate privacy disclosure — a trust and potential legal problem, exactly the class of item that needs to be truthful at launch.
- **Evidence:** `src/pages/privacy.ts`; `src/pages/dashboard/[section].ts:30`; `community-entry.js:78,100`; `src/pages/api/onboarding.ts:17`; `src/server/notifications.ts:31`.
- **Confidence:** High.
- **Fix:** correct the copy to describe the explicit interest selection *and* the learned category-click signal; have qualified legal review the policy. **Verify:** policy text matches the actual signup + personalization behavior.

#### H3 — Google Fonts load third-party, unconditionally, before any consent (and undisclosed)
- **Persona/journey:** every first-time visitor (privacy/GDPR).
- **Observed:** `index.html:8-10` loads `fonts.googleapis.com`/`fonts.gstatic.com` on every page before any consent gate. The consent mechanism (`analytics.js`) covers only Google Analytics; `privacy.ts`'s "service providers and embedded media" list omits Google Fonts. This sends the visitor's IP to Google pre-consent.
- **Impact:** a well-known EU/GDPR exposure (remote Google Fonts hotlinking has drawn fines); also undisclosed.
- **Evidence:** `index.html:8-10`; `analytics.js` (GA-only consent); `src/pages/privacy.ts` (no fonts mention).
- **Confidence:** High (fonts loading is verified live); legal characterization needs qualified review.
- **Fix:** self-host the two fonts (removes the third-party call entirely and improves performance), or gate + disclose. **Verify:** no request to `fonts.g*` before consent.

#### H4 — No Content-Security-Policy (removes the main mitigation for B1)
- **Observed:** `src/middleware.ts:7-10` sets `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy` but **no `Content-Security-Policy`**. (HSTS *is* present at the edge via Vercel — live `strict-transport-security: max-age=63072000` — but without `includeSubDomains`/`preload`.)
- **Impact:** with the B1 XSS present, there is no second line of defense; even after B1 is fixed, CSP is standard hardening for an app that server-renders and client-renders user content.
- **Evidence:** `src/middleware.ts`; live headers.
- **Confidence:** High.
- **Fix:** add a CSP. Note `src/pages/index.ts` injects an inline `<script>`, so use a nonce or hash (or move it to a file) rather than `unsafe-inline`. **Verify:** CSP present; catalog XSS payload blocked even if unescaped.

### MEDIUM

- **M1 — `sharing_preference` "Privately" is inert for an already-public listing.** Choosing Privately only blocks a *new* `submit()` (`src/server/listing-service.mjs:68`); it is excluded from `MATERIAL_FIELDS` (`listing-service.mjs:9`), so changing it never unpublishes or resets review. Visibility is driven solely by `listing_status`. The UI note points to Unpublish (partial mitigation) but the control reads as a live privacy switch, and the private-mode note conflates listing privacy with the external app's own access control (`community-entry.js:9-10`). **Fix:** make the field material (private → withdraw) or clearly frame it as pre-publication intent. Confidence: High (code-cited).
- **M2 — "Help five different projects to unlock a slot" — copy says *projects*, logic counts distinct *creators*.** Enforcement is `count(distinct creator_user_id)/5` (`database/014_...:36,140`); the error says "five different projects" (`src/pages/api/projects.ts:68`). Helping 5 projects by one creator unlocks nothing, contradicting the message. **Fix:** align copy to "creators." Confidence: High.
- **M3 — Interests collected at signup can never be edited.** Failure copy says "update them in account preferences" (`community-entry.js:103`) but no interests editor exists (dashboard shows only learned clicks + toggles; `profile.ts` has none). Dead-end promise. **Fix:** add an interests editor or correct the copy. Confidence: High.
- **M4 — `listing-preview` is unauthenticated with a per-instance in-memory rate limit.** `src/pages/api/listing-preview.ts:6-19` requires only `sameOrigin` (no `currentUser`/`emailVerified`) and launches headless Chromium (budget 45 req/14 MB/18 s) throttled by an in-memory `Map` (3/min/IP) that resets on cold start and is per serverless instance. Resource/cost-abuse vector (the SSRF itself is well-mitigated). **Fix:** require an authenticated verified member and use the DB-backed `cw_rate_limit`. Confidence: High.
- **M5 — Founder identity mismatch.** About names the founder **"Chris Nava"** (`community-entry.js:22`) with contact `hello@trymybuild.com` (`:25`), while Terms/Privacy name the operator **"Christian Tumalán"** and the verified-creator tooltip says "Christian Tumalán confirmed control…" (`app.js:185`). Two public names for one person is a trust/consistency risk. **Fix:** reconcile (e.g., legal name in policies, and a consistent public founder identity) or explain the relationship. Confidence: High.
- **M6 — No DMARC record.** DNS: MX=Zoho, SPF present (`v=spf1 include:zohomail.com ~all`), DKIM present (`zmail._domainkey`), but `_dmarc.trymybuild.com` has **no record**. Weakens anti-spoofing/deliverability for a domain that will send/receive mail (`hello@`, support). **Fix (owner):** publish a DMARC record (start `p=none` with reporting, tighten later). **Verify:** `dig TXT _dmarc.trymybuild.com` returns a policy. Confidence: High. (Mailbox send/receive delivery was **not** tested.)
- **M7 — Wish-list category filter is coupled to the main catalog.** `community-entry.js:88` writes `state.category`, silently re-filtering the catalog when a visitor changes the "Explore wishes by category" select (and vice-versa). Surprising cross-effect. **Fix:** give the wish list its own state or label the coupling. Confidence: Medium (behavioral inference from code).
- **M8 — No per-user cap on distinct wishes.** POST is rate-limited 5/hour and de-dupes exact duplicates (`wishes.ts:21,25`) but distinct wishes accumulate unbounded, enabling public-list flooding. **Fix:** cap active wishes per user. Confidence: High.
- **M9 — www/legacy canonical redirect is 307 (temporary), not 301/308.** `src/middleware.ts:5` uses `context.redirect(dest, 307)` for `www.` and `creatorworks.vercel.app` → apex. Search engines treat 307 as temporary and may not consolidate ranking. **Fix:** use 308 (or 301). Confidence: High (live www→307 confirmed).

### LOW

- **L1 — Static assets are served `cache-control: public, max-age=0, must-revalidate`** (`/app.js`, `/styles.css`, `/analytics.js`), i.e., revalidated every load; `prepare-site.mjs` copies unhashed filenames so long-lived immutable caching isn't possible. Performance on repeat visits. **Fix:** fingerprint asset filenames and cache immutably.
- **L2 — Transactional notifications bypass opt-out.** Preferences gate only digest-type notifications (`notifications.ts:10,31-33`); credits/verification/admin notifications are inserted by DB triggers with no preference check (in-app only — not email). Confirm this is intended.
- **L3 — No self-service edit/delete of one's own feedback/replies** (`database/003_...:26` grants select,insert only; admin-only hide). Users cannot correct/retract a comment.
- **L4 — Comment word-limit UI inconsistency.** Composer says "Write 7–150 words" but the live counter only flags the 7-word minimum, not the 150 max (`app.js:480,501,504`).
- **L5 — Guest personalization is on by default**, writing `trymybuild-category-clicks-v1` to localStorage immediately (`app.js:~1337`); the opt-out lives only in the authenticated dashboard. Consider a guest control/disclosure.
- **L6 — HSTS lacks `includeSubDomains`/`preload`; home page lacks OpenGraph/canonical** (project detail pages *do* have full OG/Twitter/canonical — good). Minor SEO/social polish.
- **L7 — Accessibility polish:** no skip-to-content link; several sub-44px touch targets ("?" helpers ~23–26px, quote-dismiss "×" ~19px); low-contrast `--muted #66736e` at small sizes; focus not moved to `#app` on client route change. (`launch-refinements.css`, `index.html`, `feedback-ui.ts`.)
- **L8 — Legal pages route contact to `/dashboard/help`, which is auth-gated (401 for guests).** A public `hello@trymybuild.com` exists on About, so a guest contact path *does* exist, but the policy pages should also expose the email so logged-out users can reach support.
- **L9 — `product.url` rendered unescaped in an `href`** (`app.js:492`); validated http/https + URL-encoded, low risk — escape for consistency.

### Confirmed-solid protections (credit where due — verified)

OAuth PKCE (S256) + `state` compared with `timingSafeEqual`, 600 s httpOnly state/verifier cookies, `emailVerified` enforced at callback, impersonators rejected, redirect via strict `feedbackDestination` allowlist (no open redirect) · `cw_session` httpOnly + `sameSite=lax` + secure-on-https + sealed WorkOS session; `currentUser` re-checks `account_status='active'` · **CSRF** `sameOrigin` on every mutating POST · **IDOR/ownership**: all writes scoped to server-session `owner_user_id`, optimistic concurrency (`updateOwnedGuarded` status+lock_version), image serving via `canViewProject`, threads via exact `threadAccess`; no body-supplied owner ids trusted · **SSRF** (`preview-network.mjs`): protocol/credential/port/host allowlist, unicast-only IPs, DNS pinning vs rebinding, per-hop redirect re-validation (max 3), byte/time budgets, IPv4-mapped normalization, puppeteer JS-off + `MAP *→NOTFOUND` + subresource re-validation · **Uploads**: `sharp` re-encode authoritative (format/pixel/size caps, metadata stripped), versioned keys, DB-ref-before-delete · **DB (001–018)**: service-role key server-only, **every** table RLS-enabled with grants only to `service_role` (anon/authenticated revoked), SECURITY DEFINER funcs set `search_path` + revoke from public, private `project-previews` bucket · **Rate limiting**: DB-backed `cw_rate_limit` (migration 008), **fail-closed**, applied on 18 write endpoints · **Analytics**: genuinely consent-gated (nothing until "granted", default-denied, `_ga` cookies cleared on decline, IDs/search/dashboard excluded) · **Notifications**: in-app inbox only (no email/SMS path — not conflated) · **Verification**: admin-granted only, requires 50 credits + a published project, never auto-granted, "not a guarantee of product quality" disclaimers · **Account rights**: export (`/api/account-export`) and deletion-request flow with reauth + consent, admin processing, redaction/tombstone · **SSR pages escape user content** (`tell`, `people`, `projects/[slug]`, `dashboard/messages`, `admin/*`) via `e()` · TLS valid (Let's Encrypt, 2026-09-09→12-08), CAA set, security headers present (nosniff/frame DENY/referrer/permissions/HSTS) · 149 tests + typecheck + build pass; 0 production `npm audit` vulnerabilities.

---

## 3. Coverage matrix

| Area | Status | Notes / tool |
|---|---|---|
| Baseline & architecture inventory | **Passed** | git/remote/HEAD verified; routes/migrations/tests mapped (static). |
| Local automation (tests/typecheck/build) | **Passed** | 149 tests, `astro sync && tsc`, `astro build` — all green locally. |
| Security: OAuth/session/CSRF/IDOR/SSRF/uploads/RLS | **Passed (static)** | Code-verified; runtime RLS-applied state asserted by brief, not re-run. |
| Security: XSS / output escaping | **Failed** | B1 catalog stored XSS verified in `app.js`. |
| Security headers (CSP/HSTS/…) | **Partially passed** | Most present; **no CSP** (H4); HSTS lacks includeSubDomains/preload. |
| Identity/WorkOS environment | **Failed** | B2 — production on staging AuthKit (public redirect evidence). |
| SEO/indexing/robots/sitemap | **Failed (for public launch)** | B3 — global noindex, no robots/sitemap. |
| DNS/email (MX/SPF/DKIM/DMARC) | **Partially passed** | MX/SPF/DKIM present; **DMARC absent** (M6). Mailbox delivery **not tested**. |
| TLS / redirects (root/www/http/legacy) | **Passed** | Valid cert; http→308, www/legacy→307 (M9 wants permanent). |
| Privacy/consent/cookies/third-party | **Partially passed** | GA consent-gated (good); **Google Fonts pre-consent** (H3); policy inaccuracies (H2). |
| Wishes moderation/abuse | **Failed** | H1 no moderation/takedown; M8 no per-user cap. |
| Credits/slots/verification | **Passed (static), copy bug** | Enforced in DB trigger; M2 copy mismatch. |
| Feedback/comments/replies | **Passed (static)** | Word limits both layers, self-review blocked, private can't publish; L3/L4 minor. |
| Notifications | **Passed (static)** | In-app only; L2 transactional bypass of prefs. |
| Account export/deletion | **Passed (static)** | Implemented with reauth+consent+admin processing; **not run end-to-end**. |
| Visitor/discovery UX | **Passed (static)** | Gateways, search-while-typing, states, focus trap verified in code; not device-tested. |
| Creator journey (signup→publish→feedback) | **Blocked (not exercised)** | No authorized test account; static review only. |
| Accessibility | **Partially passed** | Code-level review only; L7 items. No screen-reader/device testing. |
| Performance | **Partially passed** | Header/caching review (L1); no Lighthouse/field measurement. |
| Operations: backups/restore, monitoring, alerts, billing, CI, staging isolation | **Blocked/unverified** | Requires Vercel/Supabase dashboards — not accessible to this audit. |

**Tool limitations / not tested:** no authenticated/browser session (no test account authorized) → all logged-in journeys are static-only; no WorkOS/Vercel/Supabase dashboard access → environment/redirect/branding, backup tested-restore, monitoring, alerting, and billing are unverified; no email send/receive test → deliverability unverified; no real mobile-device or screen-reader testing; runtime DB/RLS-applied state and several RPC bodies (`cw_credit_*`, `cw_transfer_project`, `cw_review_project` internals) inferred from signatures/grants, not executed.

---

## 4. Before-announcement checklist vs. optional post-launch

**Must fix before a public announcement (all low effort unless noted):**
- [ ] **B1** Escape `product.name`/`product.summary` (and raw `alt`/`aria-label` uses) in `productCard`/`catalogRow`; sweep `app.js` for other raw interpolations; add regression test. *(hrs)*
- [ ] **B2 (owner)** Move production to a WorkOS **production** environment (redirects, branding, secrets). *(owner; hrs–1 day)*
- [ ] **B3** Scope `noindex` to private routes; add `robots.txt` + `sitemap.xml`. *(hrs; depends on the soft-launch-vs-announce decision)*
- [ ] **H1** Add wish `moderation_status` + admin hide/remove (or report flow). *(0.5–1 day; migration — owner-approved)*
- [ ] **H2** Correct the Privacy Policy interest disclosure (+ legal review). *(hrs)*
- [ ] **H3** Self-host Google Fonts (or gate+disclose). *(hrs)*
- [ ] **H4** Add a Content-Security-Policy (nonce/hash for the inline script). *(hrs)*

**Strongly recommended pre-announcement:**
- [ ] **M4** Require auth+verified and DB rate-limit on `listing-preview`. *(hrs)*
- [ ] **M1** Make `sharing_preference` actually enforce (private → withdraw) or reword. *(hrs)*
- [ ] **M2/M3/M5** Fix credits copy, interests-editor dead-end, founder-name consistency. *(hrs)*
- [ ] **M6 (owner)** Publish DMARC; **run a real send/receive test** for `hello@`. *(owner; hrs)*
- [ ] Run the **authenticated end-to-end pass** with disposable accounts (see §6).

**Optional / post-launch:** M7–M9, L1–L9 (asset caching, self-edit of feedback, a11y polish, OG on home, HSTS hardening, guest personalization control, wish cap).

---

## 5. Design improvements (ranked; evidence-based)

1. **Make privacy controls honest and reachable (low cost, high trust).** Fix the interest-disclosure contradiction (H2), add the missing interests editor (M3), surface `hello@trymybuild.com` on the policy pages (L8), and add a guest-facing note/control for on-by-default personalization (L5). These are copy/small-UI changes that materially improve trust at launch.
2. **Resolve the sharing-preference mental model (M1).** Users will read "Privately" as a live privacy switch. Either make it enforce (toggling to Private withdraws a public listing) or relabel it as a pre-publication intent and always pair it with the explicit Unpublish control. Never let external-app access wording stand in for listing privacy.
3. **Decouple the wish-category filter from the catalog (M7)** or label the shared filter explicitly; silent cross-filtering is the kind of "counterintuitive interaction" the brief asked to hunt for.
4. **Founder identity consistency (M5).** Pick one public founder identity and use it everywhere users build trust (About, verified tooltip), keeping the legal name in policies with a one-line explanation if they differ.
5. **Mobile quote placement (M2).** Dock the floating quote so it can't overlap the creator form on ~360px screens; keep the good behaviors (dismissible, no focus theft).
6. **Accessibility baseline (L7).** Add a skip link, move focus to `#app` on client navigation, raise "?" and "×" targets to ≥44px, and lift `--muted` contrast — cheap wins that widen the audience.

## 6. Architectural improvements (ranked; with tradeoffs)

1. **Centralize output-escaping for the client SPA (root cause of B1).** The catalog vs detail inconsistency shows escaping is ad-hoc. Introduce a single trusted render helper (or a tiny tagged-template that auto-escapes interpolations) and forbid raw `${product.*}` in HTML strings via a lint rule/test. Low complexity, eliminates a whole bug class. *(Preferred over a framework change.)*
2. **Add CSP as a systemic control (H4).** Pairs with #1 so a future escaping miss can't execute. Cost: manage a nonce for the one inline script in `index.ts` (or externalize it). Low risk.
3. **Give wishes the same moderation spine as feedback/comments (H1).** They were added (016/018) without the `moderation_status`+admin-review pattern the rest of the system already uses. Reuse that pattern rather than inventing a new one — consistency, not new architecture.
4. **Unify rate-limiting on the DB-backed limiter (M4).** `listing-preview` uses an in-memory Map that is per-instance and cold-start-resettable; every other write path uses `cw_rate_limit`. Standardize on the DB limiter and drop the Map. Low cost, removes a serverless correctness gap.
5. **Asset fingerprinting for cache-ability (L1).** `prepare-site.mjs` copies unhashed assets, forcing `max-age=0`. Content-hash filenames so JS/CSS can be cached immutably behind the CDN. Moderate effort; clear performance win. Not a framework change — keep the current Astro+static approach.
6. **Not recommended now:** a framework/data-model rewrite. The Astro + WorkOS + Supabase (RLS-first, service-role-only) architecture is sound and the data model is coherent; the findings are fixable in place. A rewrite would add migration risk without addressing any observed root cause.

---

## 7. Owner-only actions / approvals & next verification sequence

**Owner-only (I cannot and did not do these):**
- Confirm/switch the **WorkOS production** environment, redirect allowlist, branding, and secrets (B2).
- Decide **soft launch vs. public announcement**, which determines whether B3 (indexing) is a blocker now.
- Approve and apply any **migration** for wish moderation (H1) — I did not and will not run migrations.
- Publish **DMARC** and run a **mailbox send/receive** test (M6).
- Provide access (or run checks) for **backups/tested-restore, monitoring/alerts, billing limits, staging isolation, CI linkage** — all currently unverified.

**Realistic next verification sequence (with disposable, clearly-labeled test accounts on a staging/preview deploy, not production):**
1. Fix B1/H4 locally → add the XSS regression test → re-run `npm test` + build.
2. On a preview deploy with the WorkOS production env: exercise **signup → email verification → create draft → upload image → publish → founder review/approve → appears in catalog → second account leaves feedback → credits/slot unlock → in-app notification → export data → request deletion → admin completes deletion**. Record pass/fail per step.
3. Re-check indexing/robots/sitemap after scoping noindex; validate DMARC with a test send; run a Lighthouse/a11y pass on mobile.
4. Only then announce.

---

## 8. Final git status & change confirmation

```
$ git rev-parse --short HEAD   → 4542803
$ git status --porcelain (excluding pre-existing untracked owner docs/output):
 M index.html                  ← pre-existing approved slogan (preserved, untouched)
 M tests/branding.test.mjs     ← pre-existing approved slogan (preserved, untouched)
?? CLAUDE_LAUNCH_AUDIT_REPORT.md  ← this report (newly created, permitted)
```

**Confirmation:** No application code, configuration, migrations, or production state were modified. No commits, pushes, deploys, DNS/auth/billing changes, password resets, secret rotations, or production-data changes were made. No test accounts, comments, wishes, or emails were created. All live checks were read-only (public HTTP/DNS/TLS + non-mutating navigation and redirect-following; no credentials used or exposed). The only file added by this audit is `CLAUDE_LAUNCH_AUDIT_REPORT.md`. The uncommitted slogan change and all untracked owner documents were preserved.
