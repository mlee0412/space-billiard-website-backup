# Space Website Public Snapshot Manifest — 2026-06-04 20:08 EDT

## Scope

Read-only emergency public-surface snapshot for Space venue websites after website custody/access uncertainty.

Captured domains:
- `spacepingpong.com`
- `spacekaraoke.com`
- `spacebilliard.com`
- `popkaraoke32.com`
- `igolf32.com`
- `talnyc.com`
- `sp32.co`
- `space32.co`
- `ktxnyc.com`
- `maze32.com`

## What Was Captured

For each domain:
- Homepage HTML and response headers.
- `robots.txt`.
- Common sitemap endpoints: `sitemap.xml`, `sitemap_index.xml`, `wp-sitemap.xml`, `page-sitemap.xml`, `post-sitemap.xml`.
- Public WordPress REST endpoints where available: root, pages, posts, media, users.
- Basic DNS readouts: A, NS, and `www` CNAME.

Archive:
- Expanded folder: `reports/space-website-public-backups/20260604-200804/`
- Compressed archive: `reports/space-website-public-backups/space-website-public-snapshot-20260604-200804.tar.gz`
- Expanded size: 28 MB
- Compressed size: 2.5 MB
- File list: `file-list.txt`

## Capture Summary

| Domain | HTTP | Expanded Size | Public WP Page JSON |
|---|---:|---:|---:|
| `spacepingpong.com` | 200 | 5772 KB | 318936 bytes |
| `spacekaraoke.com` | 200 | 4912 KB | 457716 bytes |
| `spacebilliard.com` | 200 | 5188 KB | 353952 bytes |
| `popkaraoke32.com` | 200 | 1956 KB | 147756 bytes |
| `igolf32.com` | 200 | 1832 KB | 768150 bytes |
| `talnyc.com` | 200 | 3060 KB | 183865 bytes |
| `sp32.co` | 301 to `space32.co` | 948 KB | placeholder/redirect-style response |
| `space32.co` | 200 | 5328 KB | 243858 bytes |
| `ktxnyc.com` | 200 | 60 KB | placeholder/empty response; homepage body was 0 bytes |
| `maze32.com` | 200 | 76 KB | static/custom-looking response; WordPress not confirmed |

## Limits

This is not a full WordPress backup.

Not captured without credentials:
- WordPress database SQL export.
- Full `wp-content/uploads`.
- Themes, plugins, and custom code.
- `wp-config.php`, server files, hosting control panel files, logs, and cron jobs.
- Existing backup plugin/provider configuration.
- Cloudflare zone export, registrar ownership, members, roles, and billing.

## Next Credentialed Backup Steps

After Cloudflare/WordPress/hosting access is available:
1. Export Cloudflare zone settings and DNS for every domain.
2. Confirm hosting provider/control panel and backup retention.
3. Run per-site WordPress backup through hosting panel, WP CLI, or a backup plugin.
4. Export each WordPress database and `wp-content` directory.
5. Store backups in a dated, access-controlled location and document restore steps.

No DNS, Cloudflare, WordPress, hosting, email, billing, or public site settings were changed during this snapshot.
