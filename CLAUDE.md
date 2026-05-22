# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the marketing and documentation website for **Editoria11y**, an open-source accessibility checker tool. The site covers Drupal/WordPress integrations, installation guides, features, and community membership. Domain: editoria11y.com.

## Local Development

This project uses **DDEV** for local development (Docker-based):

```bash
ddev start          # Start the local environment
ddev stop           # Stop the environment
ddev describe       # Show project info (local URL, etc.)
```

The site is served from the project root (no separate docroot) via nginx-fpm.

To update the bundled Editoria11y library from GitHub:
```bash
bash scripts/get.sh
```

## Architecture

**Static HTML produced by a small Node build step.** Source content lives as `<main>`-only fragments at `content/<lang>/<page>.html`. A single shell at `template.html` plus chrome strings in `assets/lang/i18n.js` produce the deployed pages via `scripts/build-pages.js`.

**URL scheme:** English is canonical at the site root (`/`, `/<slug>/`); other languages live under `/<lang>/.../`  with translated slugs. The "about" page lives at the language root — `/` for English, `/<lang>/` for others — not under `/about/`. The build also emits crawlable meta-refresh redirect stubs under `/en/<slug>/` (and at `/<lang>/<en-slug>/` for non-English languages whose slugs are translated) so legacy URLs keep resolving. Stubs carry no `noindex` — Google follows the meta-refresh as a soft redirect and updates its index toward the canonical URL.

- **Styling**: Bootstrap 5 (`assets/bootstrap/`) + custom overrides in `assets/theme.css`
- **JavaScript**: `assets/theme.js` handles nav population, active link highlighting (navbar and footer), language picker, and responsive offcanvas menu. `assets/lang/i18n.js` provides i18n configuration (path mappings, nav strings, native language names) consumed by theme.js. `assets/demo.js` powers the live accessibility checker demos. The site does not auto-detect or redirect based on browser language; visitors land on the URL they request. (The one exception is `/codes/` — a short-URL entry point for QR codes — which still uses browser-language detection to choose a destination.)
- **Syntax highlighting**: Prism.js (`assets/prism/`)
- **Editoria11y library**: Bundled at `assets/ed11y/` (pulled via `scripts/get.sh` from the `3.0.x-dev` branch)
- **Freemius**: Payment/plugin management CSS in `assets/freemius/`

## Build Pipeline

```
content/en/<page>.html       ─┐       /index.html, /<slug>/index.html         (English, canonical)
content/<lang>/<page>.html   ─┤  →    /<lang>/index.html, /<lang>/<translated-slug>/index.html
template.html                ─┤       /en/index.html, /en/<slug>/index.html   (redirect stubs)
assets/lang/i18n.js          ─┘       /<lang>/<en-slug>/index.html            (slug-redirect stubs)
```

- `node scripts/build-pages.js` — build everything (canonical pages + alias redirect stubs).
- `node scripts/build-pages.js <lang> [page]` — build a subset.
- Built files are tracked in git; rebuild after editing any fragment.

Chrome assets (Bootstrap, Prism, `theme.css`/`theme.js`, `i18n.js`) are cache-busted per-file with a SHA-1 of file contents (`?v=<hash>`). The build stamps the current hash into every emitted page and into `codes/index.htm`. Returning visitors only re-fetch an asset when its content actually changes — and a rebuild with no asset changes is byte-identical, so the working tree stays clean. If you add a new chrome asset, register it in `CACHE_BUSTED_ASSETS` in `scripts/build-pages.js`.

Other scripts under `scripts/`:
- `normalize-segments.js` — assign `data-i18n-id` to translatable blocks in English fragments and refresh hashes in `assets/lang/manifest.json` under `source`. Idempotent.
- `migrate-to-fragments.js` — one-shot extraction of legacy full-page HTML into fragments (used once during the fragment-pipeline migration).
- `verify-build.js` — semantic-diff built output against git HEAD. Catches accidental content loss. For English pages it falls back to the pre-restructure `/en/...` path in git HEAD so the diff still works across the root-canonical move.
- `seed-translations.js` — one-shot seeder used during migration to populate `manifest.translations`.
- `scaffold-translation.js` — create empty fragments for a new (or partial) language seeded from English placeholders.
- `generate-sitemap.js` — emit `sitemap.xml` with hreflang alternates.
- `find-stale-dirs.js` — find non-English directories whose slug no longer matches the current `i18n.paths` mapping; can rewrite them as redirect stubs.
- `get.sh` — pull the latest Editoria11y library from GitHub.

## Page Structure

Each fragment in `content/<lang>/<page>.html` is a single `<main>` element with translatable content. Every translatable block (`<p>`, `<li>`, `<h*>`, `<button>`, etc.) and every `<img>` carries a `data-i18n-id` attribute; the build strips these attributes from deployed output. Internal links inside fragments are authored as canonical English absolute paths (`/en/<slug>/`) — this is an authoring convention only; the build rewrites them to the deployed shape (e.g. `/en/features/` → `/features/` for English, `/de/funktionen/` for German). Page titles are derived from each fragment's `<h1>` text — no per-fragment frontmatter is required unless overridden via a top-of-file `<!-- title-override: ... -->` comment.

The `/codes/` short URL (used in QR codes) is a hand-written redirect stub at `codes/index.htm`. It is the only entry point that still does browser-language detection: visitors are sent to the licensing page in their preferred language if one is available, otherwise English. The rest of the site does no automatic redirection.

Light/dark mode is controlled via the `data-bs-theme` attribute on `<html>` in `template.html` (currently `light` on all pages). The primary brand color is `#712cf9` (purple).

## Translations

Translated content lives at `content/<lang>/<page>.html`. `assets/lang/manifest.json` tracks segment-level hashes:

- `source.<page>.<segId>` — current hash of each English segment.
- `translations.<lang>.<page>.<segId>` — hash the existing translation was last synced to. An empty `{}` for a page means every segment needs a fresh translation pass.

The `/translations <langCode> [page]` skill (see `.claude/skills/translations/SKILL.md`) does incremental translations by hash-diffing: only changed or new segments are read and rewritten, not whole pages. This is the token-efficient design: a one-paragraph English edit propagates to all languages by touching one segment per language.

- **Configuration**: `assets/lang/i18n.js` — path mappings, nav strings per language, native language names.
- **Manifest**: `assets/lang/manifest.json` — segment hashes (`source` + per-language `translations`).
- **Sitemap**: `sitemap.xml` is generated by `node scripts/generate-sitemap.js`. Regenerate after adding, moving, or deleting a page or language.

To add a new language:
1. Add nav strings to `i18n.nav.<langCode>` and the lang code to `i18n.allLanguages` + `nativeNames` in `assets/lang/i18n.js`.
2. Run `node scripts/scaffold-translation.js <langCode>` to create empty fragments and empty manifest entries.
3. Run `/translations <langCode>` to populate.
4. Run `node scripts/build-pages.js <langCode>`.
5. Run `node scripts/generate-sitemap.js`.
