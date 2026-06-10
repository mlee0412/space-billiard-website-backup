# Space Billiards Website Backup

Public website recovery snapshot for `spacebilliard.com`, captured on 2026-06-04.

## Contents

- `homepage.html` — captured public homepage HTML.
- `meta/` — response headers, robots.txt, and sitemap endpoints.
- `public-api/` — public WordPress REST API responses available without credentials.
- `dns/` — public DNS readouts for A, NS, and www CNAME.
- `SNAPSHOT-MANIFEST.md` — portfolio snapshot manifest and limitations.

## Notes

This is a public-surface backup, not a credentialed WordPress or hosting backup. It does not include the database export, full uploads directory, theme/plugin source, `wp-config.php`, hosting files, Cloudflare settings, or registrar/account metadata.

Use this repo as a design and recovery reference for AI agents, developers, and human designers.

## Deployable Emergency Site

- `index.html` - static emergency customer-facing fallback site.
- `styles.css` - shared responsive venue-site styling.
- `assets/` - customer-facing media copied from the public website backup and WordPress media API.
- `_verification/` - desktop and mobile screenshots generated during preview checks.

Vercel project: `space-billiard-emergency-site`

This repo preserves the original public-surface recovery snapshot and adds a deployable static preview for emergency continuity, AI agents, developers, and human designers.

