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

**Pure static HTML** — no build pipeline, no package manager. Pages are hand-authored HTML files under `en/<topic>/index.html`.

- **Styling**: Bootstrap 5 (`assets/bootstrap/`) + custom overrides in `assets/theme.css`
- **JavaScript**: `assets/theme.js` handles nav population, language routing, active link highlighting, and responsive offcanvas menu. `assets/demo.js` powers the live accessibility checker demos.
- **Syntax highlighting**: Prism.js (`assets/prism/`)
- **Editoria11y library**: Bundled at `assets/ed11y/` (pulled via `scripts/get.sh` from the `3.0.x-dev` branch)
- **Freemius**: Payment/plugin management CSS in `assets/freemius/`

## Page Structure

All content pages follow the structure in `template.html`. Pages live at `en/<topic>/index.html`. Navigation links are dynamically injected by `theme.js` based on `validTranslations` — adding a new language requires updating that array.

Light/dark mode is controlled via the `data-bs-theme` attribute on `<html>`. The primary brand color is `#712cf9` (purple).
