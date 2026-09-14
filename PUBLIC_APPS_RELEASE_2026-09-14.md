# Public launch apps — September 14, 2026

All eleven launch tools are served as public static sites at `https://trymybuild.com/projects/<directory>/index.html`. The ten former ChatGPT Sites destinations no longer appear in the live catalog. AfterSchool Together retains its existing static site; its catalog destination is now absolute.

The React tools retain their original audience-specific copy, calculations, layouts, icons and artwork. Their production React runtime, CSS and fonts are self-hosted; no ChatGPT, Sites or WorkOS session is used. Existing marketplace authentication remains unchanged. Attribution remains TryMyBuild Studio.

## Verification

- Production deployment: `dpl_3LPuHKmRxynae3Ez7QVYoqxKTNFN` (trymybuild.com).
- All eleven routes returned HTTP 200 without credentials.
- Clean Chrome sessions verified app controls and loaded assets without authentication dependencies or console errors; 1440px and 390px layouts fit the viewport.
- Ten React apps: add, edit and reset controls verified. AfterSchool Together: example agenda and activity dialog verified.
- Public catalog API confirms eleven same-domain destinations and “No sign-in needed to try it.”
- Existing 195 marketplace tests and two new migration regression tests pass; TypeScript check passes.

## Maintenance

Deployable static artifacts live in `projects/`; `prepare-site.mjs` includes them automatically. Original independent app source repositories remain in the local “10 little projects for Creator Works” workspace. Its `scripts/build-public-apps.mjs` rebuilds the ten standalone React exports from those sources; `scripts/verify-public-apps.mjs https://trymybuild.com` performs guest-browser checks. Rebuilding is only needed when an app changes, not for normal marketplace releases.

`scripts/public-app-link-migration.json` records old and new public destinations for rollback. The migration changes only the eleven published studio projects’ destination and access labels, with optimistic concurrency protection. It ran inside the existing production environment without exporting database credentials. The build hook is inert unless both `VERCEL_ENV=production` and the explicit one-time build flag `TRYMYBUILD_MIGRATE_PUBLIC_APPS=1` are supplied. Ordinary builds never mutate catalog data.

Keep the standalone files deployed when rolling back marketplace code: live catalog links now point to them. Do not revert to the old Sites URLs unless intentionally restoring their sign-in requirement.
