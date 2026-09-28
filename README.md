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
