---
name: translations
description: Translate page fragments and update stale segments for the project's target languages.
---

# Fragment-Based Translation Workflow

The site is built from `<main>`-only HTML fragments at `content/<lang>/<page>.html`. Each translatable block carries a `data-i18n-id` attribute. `assets/lang/manifest.json` hashes each English segment under `source` and tracks per-language hash-last-translated-from under `translations`. The translation skill diffs hashes to do incremental updates.

Built `<lang>/<page>/index.html` files are produced by `scripts/build-pages.js` and **are not edited directly**.

## The Target Languages

bg	da	el	es	fi	hu	it	ko	lv	nl	pt-br	ro	sl	tr	zh
cs	de	en	et	fr	id	ja	lt	nb	pl	pt-pt	sk	sv	uk

## Pages

`about`, `features`, `demo`, `contacts`, `install`, `drupal`, `license`, `privacy-policy`, `cookie-policy`, `terms-of-use`, `legal-notice`

## Invoking

```
/translations <langCode> [page]
/translations --status
```

## Workflow

### 1. Refresh source hashes

Always start by running `node scripts/normalize-segments.js` to assign IDs to any new English blocks and refresh the `source` hashes in the manifest. Idempotent — safe to run anytime.

### 2. Compute the per-segment delta

For each (lang, page) in scope:

- `source[page]` — current English hashes (canonical).
- `translations[lang][page]` — hashes the existing translation was last synced to.

Three categories per segment ID:

- **New** — present in `source[page]`, absent in `translations[lang][page]`. Fresh translation needed.
- **Changed** — present in both, hashes differ. Retranslate this segment only.
- **Orphan** — present in `translations[lang][page]`, absent in `source[page]`. Drop from the target fragment and the manifest.

If `translations[lang][page]` is `{}` (empty), the entire page needs a fresh pass — every segment is treated as new. This happens for newly-scaffolded languages and for pages flagged after migration as structurally drifted (notably `about` and `license` across most languages, due to pre-existing English edits that never propagated).

### 3. Read only what you need

Open `content/en/<page>.html` and locate just the segments to translate by their `data-i18n-id`. Do **not** read the whole page if only a few segments are affected. For changed segments, also open `content/<lang>/<page>.html` and read the existing translation of the same ID — it's often a good starting point or context.

### 4. Translate

For each segment to translate:

- **Block segments** (`<p>`, `<li>`, `<h*>`, `<button>`, etc.): translate the visible text, preserve HTML structure, classes, IDs, `data-*` attrs, `<a href>`, inline `<code>`/`<strong>`/`<em>`, and any nested `<img>`. Image alt text is its own segment and is handled separately — do NOT translate alt attributes when working on a block segment that contains an `<img>`.
- **Image segments** (`<img>`): translate the `alt`, `aria-label`, `title`, and `longdesc` attributes if present. Leave decorative images (`alt=""`) untouched. Image segments share the same `data-i18n-id` slot as block segments — match by ID.
- Preserve straight quotes (`"`, `'`) inside HTML tags. Never use smart/curly quotes inside `<…>`.
- Never translate: the brand name `Editoria11y`, code examples, SVG markup, CSS class names, URL paths, technical terms (HTML, CSS, JavaScript, Drupal, WordPress, CMS, API, WYSIWYG, CKEditor, TinyMCE, Gutenberg).
- Demo content IS translatable. The checker itself is multilingual, so the demo paragraphs should be localized.
- Always ask each agent to do two passes: one to translate, one to polish/proofread like a native speaker, correcting errors and awkward phrasing.

If a source segment looks like a near-merge or near-split of an existing target segment, prefer reusing the existing translation as a starting point rather than translating from scratch.

### 5. Splice into the target fragment

Edit `content/<lang>/<page>.html`. For each translated segment, find the element with the matching `data-i18n-id` and replace its inner content (for blocks) or its translatable attributes (for `<img>`). Preserve the element itself, its tag, classes, IDs, and the `data-i18n-id` attribute.

For orphan segments: delete the entire element.

### 6. Update the manifest

After splicing, set `translations[lang][page][segId]` to `source[page][segId]` for every segment you translated. Remove entries for orphan IDs. Write the manifest back.

### 7. Rebuild

```bash
node scripts/build-pages.js <lang> [page]
```

This produces the deployed `<lang>/<page>/index.html` from the fragment + `template.html`. The build strips `data-i18n-id` from the output.

### 8. Verify (recommended for big changes)

```bash
node scripts/verify-build.js <lang> [page]
```

Semantic-diffs the built file against the version at git HEAD. Catches accidental content loss.

### 9. Regenerate the sitemap (only if pages or languages changed)

```bash
node scripts/generate-sitemap.js
```

Not needed for content edits within an existing (lang, page).

## Adding a New Language

1. Add the lang code to `i18n.allLanguages` and `nativeNames` in `assets/lang/i18n.js`. Add a full `nav` entry with translated chrome strings.
2. Run `node scripts/scaffold-translation.js <langCode>` to create empty fragments under `content/<langCode>/` (initially seeded from English text). The script also adds empty manifest entries.
3. Run the translation workflow above to populate the content.
4. Uncomment the lang code in `supportedLanguages` when ready to surface to visitors.
5. Run `node scripts/generate-sitemap.js`.

## Quality Guidelines

- Natural, fluent phrasing — not word-for-word.
- Tone: friendly, professional, informative.
- Use accepted accessibility terminology in the target language.
- `pt-br` and `pt-pt` differ significantly — never copy one for the other.
- Japanese and Chinese have no plural forms.
- Polish and Ukrainian have three plural forms.

## Status Check (`--status`)

Read `assets/lang/manifest.json`. For each (lang, page):

- Empty translations entry (`{}`) → "Fresh translation needed".
- All hashes match source → "Current".
- Otherwise → "Stale (N of M segments changed)".

Print a table grouped by language.

## Token-Efficiency Notes

The whole point of this workflow is to minimize tokens spent on translation. Specifically:

- Don't read whole pages. Read individual segments by ID.
- Don't write whole pages. Splice individual segments into the existing fragment.
- Don't re-translate unchanged segments. Trust the hash diff.
- For a one-paragraph English edit, expect to touch one segment per language — a few hundred tokens, not a few thousand.
