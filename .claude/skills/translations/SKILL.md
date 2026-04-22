---
name: translations
description: Translate HTML pages and update stale translations for the project's 16 target languages.
---

# HTML Translation Workflow

This site is a static HTML marketing site. The canonical English pages live at `en/<page>/index.html`. Translated pages live at `<langCode>/<page>/index.html`.

## The 16 Target Languages

`da`, `de`, `el`, `es`, `fr`, `hu`, `it`, `jp`, `nb`, `nl`, `pl`, `pt-br`, `pt-pt`, `sv`, `uk`, `zh`

## Pages

`about`, `contacts`, `demo`, `drupal`, `features`, `install`, `license`

## Invoking this Skill

Usage: `/translations <langCode> [page]`

- `/translations es` — translate or update all pages for Spanish
- `/translations es about` — translate or update only the about page for Spanish
- `/translations --status` — show which translations are stale or missing

## Translation Steps

### 1. Check Manifest

Read `lang/manifest.json`. For the requested language+page:
- If the entry is `null`: this is a **new translation** — translate the full English page.
- If the entry is a commit hash: run `git diff <hash> HEAD -- en/<page>/index.html` to see what changed. If empty, the translation is current. If there are changes, this is an **update** — apply only the changed sections to the existing translation.

### 2. Proofread the English Source
- Determine from the git diff which sections of the English source changed (if this is an update).
- Correct errors, grammar, and clarity in page sections modified in the diff, and fix before translating. If the fixes are not for obvious errors, note this in the chat and pause for user review.

### 3. Scaffold new pages

For **new translations** (manifest entry is `null`), run the scaffold script first:

```bash
node scripts/scaffold-translation.js <langCode> [page]
```

This copies the English source and automatically handles:
- `lang` attribute on `<html>`
- `<title>` tag translation
- Internal link rewriting (`../slug` → `/<langCode>/slug`)
- Nav `aria-label` translations (Toggle navigation, Close)
- Footer link labels (Library → Biblioteca, etc.)
- CTA button labels at the bottom of each page

The script requires a `nav` entry in `lang/i18n.js` for the target language (including `footer` strings). If this is the first page for a new language, add the nav entry first (see step 6).

The script will skip pages that already exist at the destination path.

### 4. Translate the `<main>` content

After scaffolding, the file has all chrome localized but the `<main>` content is still in English. Translate only the prose content inside `<main>`:

#### What to Translate
- All visible text content (headings, paragraphs, list items, button labels, link text)
- The demo content. Because the checker itself is multilingual, the demo content is not English-specific and should be translated along with the rest of the page.
- `alt` attributes on images
- `aria-label` attributes on non-chrome elements (within `<main>`)

#### What to Preserve Verbatim
- All HTML structure, classes, IDs, and `data-*` attributes
- `<code>` and `<pre>` blocks (code examples must not be translated)
- URLs and `href`/`src` values (internal links are already rewritten by the scaffold)
- `<script>` tags and JavaScript content
- SVG markup
- Image `src` paths
- CSS class names
- The brand name "Editoria11y" (never translate)
- Technical terms: HTML, CSS, JavaScript, Drupal, WordPress, CMS, API, WYSIWYG, CKEditor, TinyMCE, Gutenberg

#### Smart Quotes in HTML Tags (Critical)
Never use smart/curly quotes (`"` `"` `'` `'`) inside HTML tags. All attribute values must use straight quotes (`"` or `'`). LLMs tend to produce smart quotes when generating translated HTML. After translating, verify that no smart quotes have been introduced inside `<` `>` delimiters. For example:
- **Wrong**: `<h2 class="pt-4" id="demo">`
- **Correct**: `<h2 class="pt-4" id="demo">`

### 4. Update (changed sections only)

When updating an existing translation based on a git diff:

1. Read the git diff to understand what changed in the English source.
2. Read the existing translated page.
3. Locate the corresponding sections in the translation.
4. Apply the changes — translate only the new/modified English text while preserving the surrounding translated content.
5. Do NOT retranslate unchanged sections.

### 5. Update the Manifest

After translating, update `lang/manifest.json`:
- Set the page entry to the current `HEAD` commit hash (run `git rev-parse HEAD`).

### 6. Update i18n.js (first page for a new language only)

When creating the first page for a new language:
1. Add a `nav` entry in `lang/i18n.js` with translated navigation strings, including `label`, `footer`, `gettingStarted`, `wpLabel`, `toggleNav`, and `close`.
2. If the language will use translated URL slugs, add a `paths` entry.
3. Then run the scaffold script — it reads these strings to localize the page chrome.

## Translation Quality Guidelines

- Use natural, fluent phrasing — not word-for-word translation.
- Match the tone: friendly, professional, informative.
- Keep technical accuracy (accessibility terminology should use the accepted terms in the target language).
- `pt-pt` and `pt-br` differ significantly — do not copy one for the other.
- Japanese (`jp`) and Chinese (`zh`) have no plural forms.
- Polish (`pl`) and Ukrainian (`uk`) have 3 plural forms.

## Status Check

When invoked with `--status`, read `lang/manifest.json` and for each language+page:
- `null` → "Missing"
- Has a commit hash → run `git diff <hash> HEAD -- en/<page>/index.html`. If diff is empty → "Current". If diff has changes → "Stale (N lines changed)".

Print a summary table.
