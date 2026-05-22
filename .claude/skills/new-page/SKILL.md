---
name: new-page
description: Scaffold a new documentation page at en/<topic>/index.html using the standard site page structure
disable-model-invocation: true
---

English is canonical at the site root, so new English pages live at `$ARGUMENTS/index.html` (not under `en/`). Create the page using the template at `.claude/skills/new-page/page-template.html`.

Steps:
1. Copy the template to `$ARGUMENTS/index.html`
2. Update `<title>` to reflect the page topic
3. Update `data-bs-theme` — use `"light"` for content pages
4. Replace the `<main>` content placeholder with the requested content
5. Remind the user: if this page should appear in the nav, add a link to the `navTemplate` in `assets/theme.js`. If it needs to be available in other languages, prefer adding it as a fragment under `content/en/<slug>.html` instead (so the build pipeline owns it) and then running `/translations`.
