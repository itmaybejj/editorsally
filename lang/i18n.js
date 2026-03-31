/**
 * Editoria11y i18n configuration.
 *
 * Provides path mappings, navigation strings, and lookup helpers
 * consumed by theme.js for multilingual routing and navigation.
 *
 * To add a new language:
 *  1. Add the lang code to `supportedLanguages`.
 *  2. Add a `paths` entry mapping English slugs to translated slugs.
 *  3. Add a `nav` entry with translated navigation strings.
 *  4. Create translated pages at `/<langCode>/<translatedSlug>/index.html`.
 *  5. Set `<html lang="<langCode>">` in every translated page.
 *  6. Update manifest.json with the new language.
 *  7. Uncomment the lang code in `supportedLanguages` below.
 */

// eslint-disable-next-line no-unused-vars
const defined_i18n = (() => {
  'use strict';

  /**
   * Language codes that are ready for visitors.
   * Commented-out codes have translations in progress.
   */
  const supportedLanguages = [
    // 'da', 'de', 'el', 'es', 'fr', 'hu', 'it', 'jp',
    // 'nb', 'nl', 'pl', 'pt-br', 'pt-pt', 'sv', 'uk', 'zh',
  ];

  /**
   * Canonical English path slugs, in navigation order.
   */
  const canonicalPaths = ['about', 'features', 'demo', 'contacts', 'install', 'drupal', 'license'];

  /**
   * Path mappings: English slug -> translated slug per language.
   * English is implicit (slug === slug). Only add entries where
   * the translated slug differs from English.
   *
   * Example for Spanish:
   *   es: { about: 'acerca', features: 'características', ... }
   *
   * If a language uses English slugs, omit it or set it to {}.
   */
  const paths = {
    // es: {},
    // fr: {},
  };

  /**
   * Navigation strings per language.
   * `nav.en` is the canonical source. Each language needs:
   *   - label: object mapping English slugs to translated link text
   *   - gettingStarted: translated "Getting Started" dropdown label
   *   - wpLabel: translated "WordPress Plugin" text
   *   - toggleNav: aria-label for the mobile menu toggle
   *   - close: aria-label for the close button
   */
  const nav = {
    en: {
      label: {
        about: 'About',
        features: 'Features',
        demo: 'Demo',
        contacts: 'Contacts',
        install: 'Install & Configure',
        drupal: 'Drupal Module',
        license: 'Pricing & Contributions',
      },
      gettingStarted: 'Getting Started',
      wpLabel: 'WordPress Plugin',
      toggleNav: 'Toggle navigation',
      close: 'Close',
    },
    // es: {
    //   label: {
    //     about: 'Acerca de',
    //     features: 'Características',
    //     demo: 'Demo',
    //     contacts: 'Contactos',
    //     install: 'Instalar y configurar',
    //     drupal: 'Módulo Drupal',
    //     license: 'Precios y contribuciones',
    //   },
    //   gettingStarted: 'Primeros pasos',
    //   wpLabel: 'Plugin de WordPress',
    //   toggleNav: 'Alternar navegación',
    //   close: 'Cerrar',
    // },
  };

  /**
   * Get the translated URL path slug for a given language and English slug.
   * Falls back to the English slug if no translation is defined.
   */
  function getPath(lang, enSlug) {
    return paths[lang]?.[enSlug] || enSlug;
  }

  /**
   * Reverse lookup: given a language and a (possibly translated) slug,
   * return the canonical English slug. Used for active-link detection
   * and language switching.
   */
  function getCanonicalSlug(lang, translatedSlug) {
    const langPaths = paths[lang];
    if (!langPaths) return translatedSlug;
    for (const [enSlug, trSlug] of Object.entries(langPaths)) {
      if (trSlug === translatedSlug) return enSlug;
    }
    return translatedSlug;
  }

  /**
   * Get navigation strings for a language, falling back to English.
   */
  function getNav(lang) {
    return nav[lang] || nav.en;
  }

  /**
   * Build the full path for a page: /<langCode>/<slug>/
   */
  function buildPath(lang, enSlug) {
    return `/${lang}/${getPath(lang, enSlug)}`;
  }

  return {
    supportedLanguages,
    canonicalPaths,
    paths,
    nav,
    getPath,
    getCanonicalSlug,
    getNav,
    buildPath,
  };
})();
