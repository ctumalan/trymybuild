# CreatorWorks

**Build it. Share it. Sell it.**

## Phase 0 clickable prototype

Open `index.html` in a browser to explore the public CreatorWorks entrance and its creator Workshop. Visitors can discover useful software, browse human-centered categories, open a product page, or choose **Share your work** to begin the progressive creator journey. The creator experience begins with a project link or safe preview, then reveals one meaningful decision at a time. The prototype uses plain HTML, CSS, and JavaScript and requires no installation or framework.

The final scene includes a private Shop preview, but it does not publish, host, sell, or process payments for software.

## Locally hosted listings

Most listings link out to a creator's own site. `projects/` holds listings whose working
build is served from this repository instead, so their **Try** link works both when
`index.html` is opened directly from disk and when the folder is served over HTTP.

| Listing | Local build | Canonical source |
| --- | --- | --- |
| AfterSchool Together | `projects/afterschool-together/index.html` | `~/Documents/ChatGPT/10 little projects for Creator Works/afterschool-together` |

Each local build is a single self-contained HTML file with no external requests. They are
copies — the canonical project is the source repository listed above, and its README
documents how to rebuild and refresh the copy here. Do not edit these files in place;
edit the source project, run its checks, and copy the rebuilt file across.

A listing appearing here is a working local entry in this prototype catalog. It is not a
public deployment.

## Project review email

When a creator submits a project for review, the production app can email the founder a
direct review link. Set `RESEND_API_KEY` after verifying `trymybuild.com` with Resend.
The recipient defaults to `FOUNDER_EMAIL`; `PROJECT_REVIEW_EMAIL` can override it, and
`PROJECT_REVIEW_FROM` can override the default sender address. `WELCOME_EMAIL_FROM`
can separately set the founder welcome sender; it defaults to
`Christian at TryMyBuild <notifications@trymybuild.com>`. A delivery failure never blocks the project
submission, and retries use the project revision to prevent duplicate messages.

## Maker feedback exchange

The optional exchange at `/dashboard/exchange` pairs two active makers with
published public apps. Each asks one specific question and agrees to personally
try the other app. The existing guided feedback and Messages flows deliver the
responses; neither listing nor ordinary feedback requests require an exchange.

Apply `database/028_maker_exchange.sql` after migration 027 before publishing the
exchange UI. The migration is transactional and additive. Take a current database
backup and verify the existing migration level before applying it. Until this
migration is installed, the exchange page fails closed and other requests retain
their current behavior. No production migration or deployment is performed by the
test scripts.

Matching is automatic, oldest eligible participant first, with one active exchange
per maker. Self-matches and pairs with an existing per-app review are excluded.
Qualifying firsthand feedback marks each side separately; a completed exchange
means both responses were delivered, not that their usefulness was confirmed.
Hidden or revoked feedback removes that progress. Leaving, cancelling a request,
unpublishing a project, or disabling an account ends the exchange, preserves
existing conversations, and notifies the other participant. Match notifications
use the existing feedback alert and email settings. Matches and responses are not
guaranteed. Christian has no personal-review commitment.

Validation uses synthetic data only:

```sh
npm test
npm run check
npm run build
node scripts/test-maker-exchange-database.mjs /private/tmp/trymybuild-exchange-tests
node scripts/test-maker-exchange-concurrency.mjs /private/tmp/trymybuild-exchange-tests
```

The last two checks use temporary PGlite, `pg`, and embedded PostgreSQL dependencies,
not the application dependencies or live database. The concurrency check starts
PostgreSQL on a private Unix socket with TCP disabled and cleans up after success.
`scripts/maker-exchange-qa-server.mjs` previews synthetic join, waiting, matched,
given, completed and cancelled screens with all sending disabled.

## Owner-controlled listing previews

Apply `database/030_owner_controlled_previews.sql` before deploying the matching
application release. It records whether a preview was uploaded by its owner or
captured from the public website and keeps three rollback versions. Uploaded images
are never replaced merely because the listing URL changes; failed captures preserve
the last good image. The release schema check verifies the required columns.

## Immediate project comments

Apply `database/031_immediate_project_comments.sql` before deploying the matching
application release. It publishes new guest project comments at insertion time;
member comments are published by the application API. Rate limits, word limits,
duplicate prevention, reporting, and the ability to hide abusive comments remain.

Apply `database/032_first_community_review_count.sql` with the same release. It
adds the review count used by the first-review sticker. The count excludes
administrator reviews, removed feedback, and responses from people who selected
“I haven’t tried it yet.”

## Admin-prepared listing invitations

At `/admin/invitations`, the founder can prepare an app's name, URL, description,
benefit, first task and screenshot for a specific creator email. Creation produces
a signed preview link and a downloadable 1200×630 email image; it sends no email.
Place the image in the email and link it to the preview URL. The sample is not a
published app, account, testimonial or completed review.

Anyone holding the link can view the sample, so include only public app details.
Founder-authored first-look notes can be associated with an invitation ID in
`src/server/invitation-feedback.mjs`. The signed link opens the shared app-detail
panel over a catalog containing the private preview alongside published apps.
The preview uses the normal catalog card and app screenshot, with signup as its
primary action. Its external launch button stays disabled until the verified
invited account signs in. Founder notes use the normal review-card presentation
below the app; the in-panel review link jumps to `#invitation-review`. Existing
email links ending in `#founder-feedback` and `#invitation-review` show the app
first, pause briefly, then scroll down to its review. Visitor input cancels the
animation, and reduced-motion preferences skip it.
Notes are server-side content, not catalog reviews, and do not count toward review badges. They are readable
before signup while the invitation is open and remain available to its verified
recipient after claim. Expired or withdrawn unclaimed links do not reveal them.
Unclaimed preview links expire 48 hours after creation and can be withdrawn before
claim. Reading, signing in, or editing a preview does not reset the timer. Saving
it to the invited account completes the claim and preserves the private app draft.
The application also caps older invitations at 48 hours from their original
creation time; it does not delete saved app drafts. The creator signs in
before opening the introduction editor; the same browser tab preserves edits.
Switching accounts returns to the signed invitation. Claiming requires the invited verified email, an active account,
app-management confirmation and agreement to the terms. Claiming atomically creates
one private, unverified project owned by that creator. Retrying never duplicates
the app or overwrites later dashboard edits. The existing listing editor provides
the final screenshot review and explicit publication step. An admin cannot edit
the invitation after it has been claimed.

Apply `database/034_listing_invitations.sql` after migration 033 before releasing
the routes. It is additive and transactional, and does not modify existing apps.
The application service role is the only database role permitted to access the new
table and claim function. Preview tokens use a purpose-separated HMAC with the
existing `WORKOS_COOKIE_PASSWORD`; rotating it invalidates outstanding links.

Validation uses disposable, synthetic PostgreSQL only:

```sh
node --test tests/listing-invitations.test.mjs
node scripts/test-listing-invitations-database.mjs /private/tmp/trymybuild-invitation-tests
node scripts/test-listing-invitations-concurrency.mjs /private/tmp/trymybuild-invitation-tests
node scripts/listing-invitations-qa-server.mjs
```

The database checks use temporary PGlite, `pg`, and embedded PostgreSQL dependencies.
The local QA server simulates sign-in and private saving without real accounts or
emails. It never connects to production.
