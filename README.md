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
`PROJECT_REVIEW_FROM` can override the default sender
`TryMyBuild <notifications@trymybuild.com>`. A delivery failure never blocks the project
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
