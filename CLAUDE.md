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

**Static HTML produced by a small Node build step.** Source content lives as `<main>`-only fragments at `content/<lang>/<page>.html`. A single shell at `template.html` plus chrome strings in `assets/lang/i18n.js` produce the deployed `<lang>/<page>/index.html` files via `scripts/build-pages.js`. The "about" page lives at `<lang>/index.html` (language root), not `<lang>/about/`.

- **Styling**: Bootstrap 5 (`assets/bootstrap/`) + custom overrides in `assets/theme.css`
- **JavaScript**: `assets/theme.js` handles nav population, language routing, active link highlighting (navbar and footer), language picker, and responsive offcanvas menu. `assets/lang/i18n.js` provides i18n configuration (path mappings, nav strings, native language names, supported languages) consumed by theme.js. `assets/demo.js` powers the live accessibility checker demos.
- **Syntax highlighting**: Prism.js (`assets/prism/`)
- **Editoria11y library**: Bundled at `assets/ed11y/` (pulled via `scripts/get.sh` from the `3.0.x-dev` branch)
- **Freemius**: Payment/plugin management CSS in `assets/freemius/`

## Build Pipeline

```
content/<lang>/<page>.html  ─┐
template.html                ├─→  scripts/build-pages.js  →  <lang>/<page>/index.html
assets/lang/i18n.js          ─┘
```

- `node scripts/build-pages.js` — build everything.
- `node scripts/build-pages.js <lang> [page]` — build a subset.
- Built files are tracked in git; rebuild after editing any fragment.

Other scripts under `scripts/`:
- `normalize-segments.js` — assign `data-i18n-id` to translatable blocks in English fragments and refresh hashes in `assets/lang/manifest.json` under `source`. Idempotent.
- `migrate-to-fragments.js` — one-shot extraction of legacy full-page HTML into fragments (used once during the fragment-pipeline migration).
- `verify-build.js` — semantic-diff built output against git HEAD. Catches accidental content loss.
- `seed-translations.js` — one-shot seeder used during migration to populate `manifest.translations`.
- `scaffold-translation.js` — create empty fragments for a new (or partial) language seeded from English placeholders.
- `generate-sitemap.js` — emit `sitemap.xml` with hreflang alternates.
- `get.sh` — pull the latest Editoria11y library from GitHub.

## Page Structure

Each fragment in `content/<lang>/<page>.html` is a single `<main>` element with translatable content. Every translatable block (`<p>`, `<li>`, `<h*>`, `<button>`, etc.) and every `<img>` carries a `data-i18n-id` attribute; the build strips these attributes from deployed output. Internal links inside fragments are authored as canonical English absolute paths (`/en/<slug>/`); the build rewrites the language code and translates slugs per `i18n.paths`. Page titles are derived from each fragment's `<h1>` text — no per-fragment frontmatter is required unless overridden via a top-of-file `<!-- title-override: ... -->` comment.

Language-detection stub pages at the site root (`/features/index.html`, `/license/index.html`, etc.) redirect visitors to the appropriate language version based on browser preferences. The root `/index.html` redirects to `/{lang}/`. These stubs are NOT part of the build pipeline.

Light/dark mode is controlled via the `data-bs-theme` attribute on `<html>` in `template.html` (currently `light` on all pages). The primary brand color is `#712cf9` (purple).

## Translations

Translated content lives at `content/<lang>/<page>.html`. `assets/lang/manifest.json` tracks segment-level hashes:

- `source.<page>.<segId>` — current hash of each English segment.
- `translations.<lang>.<page>.<segId>` — hash the existing translation was last synced to. An empty `{}` for a page means every segment needs a fresh translation pass.

The `/translations <langCode> [page]` skill (see `.claude/skills/translations/SKILL.md`) does incremental translations by hash-diffing: only changed or new segments are read and rewritten, not whole pages. This is the token-efficient design: a one-paragraph English edit propagates to all languages by touching one segment per language.

- **Configuration**: `assets/lang/i18n.js` — path mappings, nav strings per language, supported language list.
- **Manifest**: `assets/lang/manifest.json` — segment hashes (`source` + per-language `translations`).
- **Sitemap**: `sitemap.xml` is generated by `node scripts/generate-sitemap.js`. Regenerate after adding, moving, or deleting a page or language.

To add a new language:
1. Add nav strings to `i18n.nav.<langCode>` and the lang code to `i18n.allLanguages` + `nativeNames` in `assets/lang/i18n.js`.
2. Run `node scripts/scaffold-translation.js <langCode>` to create empty fragments and empty manifest entries.
3. Run `/translations <langCode>` to populate.
4. Run `node scripts/build-pages.js <langCode>`.
5. Uncomment the lang code in `supportedLanguages` when ready for visitors.
6. Run `node scripts/generate-sitemap.js`.
