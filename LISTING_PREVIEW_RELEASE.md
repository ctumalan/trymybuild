# Listing preview image release

Deployed September 6, 2026 to the existing CreatorWorks Vercel project.

## Included

- Automatic public-page screenshot capture begins after the project URL step.
- Preview supports retry, replacement, file upload and drag-and-drop (PNG, JPEG or WebP, up to 5 MB).
- Images are resized and saved with the existing device-local draft. Storage failures are shown explicitly.
- Stale capture results cannot overwrite a newer URL or manually selected image.
- Preview colors are sanitized and adjusted for readable contrast.

## Safety and limitations

Capture does not use the visitor's credentials or browser session. Requests are restricted to public HTTP(S) addresses, with DNS validation, pinned connections, redirect validation and bounded time, request count and response sizes. Page scripts and nested frames are disabled. Authenticated or script-dependent pages may need an uploaded screenshot.

Rate limits and capture concurrency are per server instance, not distributed global quotas. No paid screenshot provider or new environment variables were added. Draft image storage is local to the device; this release does not implement permanent uploaded-image hosting for published listings.

## Verification

- 29 automated tests passed, including network restrictions, upload validation, accessible themes, draft persistence and stale-result protection.
- Type checking and production build passed.
- Production capture returned HTTP 200 and a JPEG for example.com.
- Browser check confirmed an uploaded image decoded at 1280 × 960 and reported successful draft storage.

Live site: https://creatorworks.vercel.app/

