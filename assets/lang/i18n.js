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
    'es',
    // 'da', 'de', 'el', 'fr', 'hu', 'it', 'ja',
    // 'nb', 'nl', 'pl', 'pt-br', 'pt-pt', 'sv', 'uk', 'zh',
  ];

  /**
   * All languages with translated pages (used by the language picker).
   * Unlike supportedLanguages, this always includes every translation.
   */
  const allLanguages = [
    'en', 'da', 'de', 'el', 'es', 'fr', 'hu', 'it', 'ja',
    'nb', 'nl', 'pl', 'pt-br', 'pt-pt', 'sv', 'uk', 'zh',
  ];

  /**
   * Native display names for the language picker.
   */
  const nativeNames = {
    en: 'English',
    da: 'Dansk',
    de: 'Deutsch',
    el: 'Ελληνικά',
    es: 'Español',
    fr: 'Français',
    hu: 'Magyar',
    it: 'Italiano',
    ja: '日本語',
    nb: 'Norsk bokmål',
    nl: 'Nederlands',
    pl: 'Polski',
    'pt-br': 'Português (BR)',
    'pt-pt': 'Português (PT)',
    sv: 'Svenska',
    uk: 'Українська',
    zh: '中文',
  };

  /**
   * Canonical English path slugs, in navigation order, followed by
   * policy pages which live only in the footer.
   */
  const canonicalPaths = [
    'about', 'features', 'demo', 'contacts', 'install', 'drupal', 'license',
    'privacy-policy', 'cookie-policy', 'terms-of-use', 'legal-notice',
  ];

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
   *   - gettingStarted: translated "Get started" dropdown label
   *   - wpLabel: translated "WordPress plugin" text
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
        install: 'Install & configure',
        drupal: 'Drupal module',
        license: 'Support the project',
        'privacy-policy': 'Privacy Policy',
        'cookie-policy': 'Cookie Policy',
        'terms-of-use': 'Terms of Use',
        'legal-notice': 'Legal Notice',
      },
      footer: {
        library: 'Library',
        forum: 'Forum',
        issues: 'Issues',
        contacts: 'Contacts',
      },
      gettingStarted: 'Get started',
      wpLabel: 'WordPress plugin',
      toggleNav: 'Toggle navigation',
      close: 'Close',
      perYear: '/year',
      perMonth: '/month',
    },
    es: {
      label: {
        about: 'Acerca de',
        features: 'Características',
        demo: 'Demo',
        contacts: 'Contacto',
        install: 'Instalar y configurar',
        drupal: 'Módulo Drupal',
        license: 'Precios y contribuciones',
        'privacy-policy': 'Política de privacidad',
        'cookie-policy': 'Política de cookies',
        'terms-of-use': 'Condiciones de uso',
        'legal-notice': 'Aviso legal',
      },
      footer: {
        library: 'Biblioteca',
        forum: 'Foro',
        issues: 'Incidencias',
        contacts: 'Contacto',
      },
      gettingStarted: 'Primeros pasos',
      wpLabel: 'Plugin de WordPress',
      toggleNav: 'Alternar navegación',
      close: 'Cerrar',
      perYear: '/año',
      perMonth: '/mes',
    },
    de: {
      label: {
        about: 'Über uns',
        features: 'Funktionen',
        demo: 'Demo',
        contacts: 'Kontakt',
        install: 'Installation & Konfiguration',
        drupal: 'Drupal-Modul',
        license: 'Preise & Beiträge',
        'privacy-policy': 'Datenschutzerklärung',
        'cookie-policy': 'Cookie-Richtlinie',
        'terms-of-use': 'Nutzungsbedingungen',
        'legal-notice': 'Impressum',
      },
      footer: {
        library: 'Bibliothek',
        forum: 'Forum',
        issues: 'Issues',
        contacts: 'Kontakt',
      },
      gettingStarted: 'Erste Schritte',
      wpLabel: 'WordPress-Plugin',
      toggleNav: 'Navigation umschalten',
      close: 'Schließen',
      perYear: '/Jahr',
      perMonth: '/Monat',
    },
    da: {
      label: {
        about: 'Om os',
        features: 'Funktioner',
        demo: 'Demo',
        contacts: 'Kontakt',
        install: 'Installer og konfigurer',
        drupal: 'Drupal-modul',
        license: 'Priser og bidrag',
        'privacy-policy': 'Privatlivspolitik',
        'cookie-policy': 'Cookiepolitik',
        'terms-of-use': 'Vilkår for brug',
        'legal-notice': 'Juridisk meddelelse',
      },
      footer: {
        library: 'Bibliotek',
        forum: 'Forum',
        issues: 'Problemer',
        contacts: 'Kontakt',
      },
      gettingStarted: 'Kom godt i gang',
      wpLabel: 'WordPress-plugin',
      toggleNav: 'Skift navigation',
      close: 'Luk',
      perYear: '/år',
      perMonth: '/måned',
    },
    el: {
      label: {
        about: 'Σχετικά',
        features: 'Λειτουργίες',
        demo: 'Demo',
        contacts: 'Επικοινωνία',
        install: 'Εγκατάσταση και ρύθμιση',
        drupal: 'Άρθρωμα Drupal',
        license: 'Τιμολόγηση και εισφορές',
        'privacy-policy': 'Πολιτική απορρήτου',
        'cookie-policy': 'Πολιτική cookies',
        'terms-of-use': 'Όροι χρήσης',
        'legal-notice': 'Νομική σημείωση',
      },
      footer: {
        library: 'Βιβλιοθήκη',
        forum: 'Φόρουμ',
        issues: 'Ζητήματα',
        contacts: 'Επικοινωνία',
      },
      gettingStarted: 'Ξεκινώντας',
      wpLabel: 'Πρόσθετο WordPress',
      toggleNav: 'Εναλλαγή πλοήγησης',
      close: 'Κλείσιμο',
      perYear: '/έτος',
      perMonth: '/μήνα',
    },
    fr: {
      label: {
        about: 'À propos',
        features: 'Fonctionnalités',
        demo: 'Démo',
        contacts: 'Contact',
        install: 'Installation et configuration',
        drupal: 'Module Drupal',
        license: 'Tarifs et contributions',
        'privacy-policy': 'Politique de confidentialité',
        'cookie-policy': 'Politique relative aux cookies',
        'terms-of-use': "Conditions d'utilisation",
        'legal-notice': 'Mentions légales',
      },
      footer: {
        library: 'Bibliothèque',
        forum: 'Forum',
        issues: 'Problèmes',
        contacts: 'Contact',
      },
      gettingStarted: 'Démarrage',
      wpLabel: 'Extension WordPress',
      toggleNav: 'Basculer la navigation',
      close: 'Fermer',
      perYear: '/an',
      perMonth: '/mois',
    },
    hu: {
      label: {
        about: 'Rólunk',
        features: 'Funkciók',
        demo: 'Demo',
        contacts: 'Kapcsolat',
        install: 'Telepítés és beállítás',
        drupal: 'Drupal-modul',
        license: 'Árak és hozzájárulások',
        'privacy-policy': 'Adatvédelmi szabályzat',
        'cookie-policy': 'Cookie-szabályzat',
        'terms-of-use': 'Felhasználási feltételek',
        'legal-notice': 'Jogi nyilatkozat',
      },
      footer: {
        library: 'Könyvtár',
        forum: 'Fórum',
        issues: 'Hibák',
        contacts: 'Kapcsolat',
      },
      gettingStarted: 'Első lépések',
      wpLabel: 'WordPress bővítmény',
      toggleNav: 'Navigáció váltása',
      close: 'Bezárás',
      perYear: '/év',
      perMonth: '/hónap',
    },
    it: {
      label: {
        about: 'Informazioni',
        features: 'Funzionalità',
        demo: 'Demo',
        contacts: 'Contatti',
        install: 'Installazione e configurazione',
        drupal: 'Modulo Drupal',
        license: 'Prezzi e contributi',
        'privacy-policy': 'Informativa sulla privacy',
        'cookie-policy': 'Politica sui cookie',
        'terms-of-use': "Condizioni d'uso",
        'legal-notice': 'Note legali',
      },
      footer: {
        library: 'Libreria',
        forum: 'Forum',
        issues: 'Segnalazioni',
        contacts: 'Contatti',
      },
      gettingStarted: 'Per iniziare',
      wpLabel: 'Plugin WordPress',
      toggleNav: 'Attiva/disattiva navigazione',
      close: 'Chiudi',
      perYear: '/anno',
      perMonth: '/mese',
    },
    ja: {
      label: {
        about: '概要',
        features: '機能',
        demo: 'デモ',
        contacts: 'お問い合わせ',
        install: 'インストールと設定',
        drupal: 'Drupalモジュール',
        license: '料金と貢献',
        'privacy-policy': 'プライバシーポリシー',
        'cookie-policy': 'クッキーポリシー',
        'terms-of-use': '利用規約',
        'legal-notice': '法的通知',
      },
      footer: {
        library: 'ライブラリ',
        forum: 'フォーラム',
        issues: '問題',
        contacts: 'お問い合わせ',
      },
      gettingStarted: 'はじめに',
      wpLabel: 'WordPressプラグイン',
      toggleNav: 'ナビゲーションを切り替え',
      close: '閉じる',
      perYear: '/年',
      perMonth: '/月',
    },
    nb: {
      label: {
        about: 'Om oss',
        features: 'Funksjoner',
        demo: 'Demo',
        contacts: 'Kontakt',
        install: 'Installer og konfigurer',
        drupal: 'Drupal-modul',
        license: 'Priser og bidrag',
        'privacy-policy': 'Personvernerklæring',
        'cookie-policy': 'Informasjonskapsler',
        'terms-of-use': 'Bruksvilkår',
        'legal-notice': 'Juridisk merknad',
      },
      footer: {
        library: 'Bibliotek',
        forum: 'Forum',
        issues: 'Problemer',
        contacts: 'Kontakt',
      },
      gettingStarted: 'Kom i gang',
      wpLabel: 'WordPress-plugin',
      toggleNav: 'Slå av/på navigasjon',
      close: 'Lukk',
      perYear: '/år',
      perMonth: '/måned',
    },
    nl: {
      label: {
        about: 'Over ons',
        features: 'Functies',
        demo: 'Demo',
        contacts: 'Contact',
        install: 'Installeren en configureren',
        drupal: 'Drupal-module',
        license: 'Prijzen en bijdragen',
        'privacy-policy': 'Privacybeleid',
        'cookie-policy': 'Cookiebeleid',
        'terms-of-use': 'Gebruiksvoorwaarden',
        'legal-notice': 'Juridische kennisgeving',
      },
      footer: {
        library: 'Bibliotheek',
        forum: 'Forum',
        issues: 'Problemen',
        contacts: 'Contact',
      },
      gettingStarted: 'Aan de slag',
      wpLabel: 'WordPress-plugin',
      toggleNav: 'Navigatie in-/uitschakelen',
      close: 'Sluiten',
      perYear: '/jaar',
      perMonth: '/maand',
    },
    pl: {
      label: {
        about: 'O nas',
        features: 'Funkcje',
        demo: 'Demo',
        contacts: 'Kontakt',
        install: 'Instalacja i konfiguracja',
        drupal: 'Moduł Drupal',
        license: 'Cennik i wkłady',
        'privacy-policy': 'Polityka prywatności',
        'cookie-policy': 'Polityka cookies',
        'terms-of-use': 'Warunki użytkowania',
        'legal-notice': 'Informacje prawne',
      },
      footer: {
        library: 'Biblioteka',
        forum: 'Forum',
        issues: 'Zgłoszenia',
        contacts: 'Kontakt',
      },
      gettingStarted: 'Pierwsze kroki',
      wpLabel: 'Wtyczka WordPress',
      toggleNav: 'Przełącz nawigację',
      close: 'Zamknij',
      perYear: '/rok',
      perMonth: '/miesiąc',
    },
    'pt-br': {
      label: {
        about: 'Sobre',
        features: 'Funcionalidades',
        demo: 'Demo',
        contacts: 'Contato',
        install: 'Instalar e configurar',
        drupal: 'Módulo Drupal',
        license: 'Preços e contribuições',
        'privacy-policy': 'Política de Privacidade',
        'cookie-policy': 'Política de Cookies',
        'terms-of-use': 'Termos de Uso',
        'legal-notice': 'Aviso Legal',
      },
      footer: {
        library: 'Biblioteca',
        forum: 'Fórum',
        issues: 'Problemas',
        contacts: 'Contato',
      },
      gettingStarted: 'Primeiros passos',
      wpLabel: 'Plugin WordPress',
      toggleNav: 'Alternar navegação',
      close: 'Fechar',
      perYear: '/ano',
      perMonth: '/mês',
    },
    'pt-pt': {
      label: {
        about: 'Sobre',
        features: 'Funcionalidades',
        demo: 'Demo',
        contacts: 'Contacto',
        install: 'Instalar e configurar',
        drupal: 'Módulo Drupal',
        license: 'Preços e contribuições',
        'privacy-policy': 'Política de Privacidade',
        'cookie-policy': 'Política de Cookies',
        'terms-of-use': 'Termos de Utilização',
        'legal-notice': 'Aviso Legal',
      },
      footer: {
        library: 'Biblioteca',
        forum: 'Fórum',
        issues: 'Problemas',
        contacts: 'Contacto',
      },
      gettingStarted: 'Primeiros passos',
      wpLabel: 'Plugin WordPress',
      toggleNav: 'Alternar navegação',
      close: 'Fechar',
      perYear: '/ano',
      perMonth: '/mês',
    },
    sv: {
      label: {
        about: 'Om oss',
        features: 'Funktioner',
        demo: 'Demo',
        contacts: 'Kontakt',
        install: 'Installera och konfigurera',
        drupal: 'Drupal-modul',
        license: 'Priser och bidrag',
        'privacy-policy': 'Integritetspolicy',
        'cookie-policy': 'Cookiepolicy',
        'terms-of-use': 'Användarvillkor',
        'legal-notice': 'Juridiskt meddelande',
      },
      footer: {
        library: 'Bibliotek',
        forum: 'Forum',
        issues: 'Problem',
        contacts: 'Kontakt',
      },
      gettingStarted: 'Kom igång',
      wpLabel: 'WordPress-plugin',
      toggleNav: 'Växla navigering',
      close: 'Stäng',
      perYear: '/år',
      perMonth: '/månad',
    },
    uk: {
      label: {
        about: 'Про нас',
        features: 'Функції',
        demo: 'Демо',
        contacts: 'Контакти',
        install: 'Встановлення та налаштування',
        drupal: 'Модуль Drupal',
        license: 'Ціни та внески',
        'privacy-policy': 'Політика конфіденційності',
        'cookie-policy': 'Політика щодо файлів cookie',
        'terms-of-use': 'Умови використання',
        'legal-notice': 'Юридичне повідомлення',
      },
      footer: {
        library: 'Бібліотека',
        forum: 'Форум',
        issues: 'Проблеми',
        contacts: 'Контакти',
      },
      gettingStarted: 'Початок роботи',
      wpLabel: 'Плагін WordPress',
      toggleNav: 'Перемкнути навігацію',
      close: 'Закрити',
      perYear: '/рік',
      perMonth: '/місяць',
    },
    zh: {
      label: {
        about: '关于',
        features: '功能',
        demo: '演示',
        contacts: '联系',
        install: '安装与配置',
        drupal: 'Drupal模块',
        license: '定价与贡献',
        'privacy-policy': '隐私政策',
        'cookie-policy': 'Cookie 政策',
        'terms-of-use': '使用条款',
        'legal-notice': '法律声明',
      },
      footer: {
        library: '库',
        forum: '论坛',
        issues: '问题',
        contacts: '联系',
      },
      gettingStarted: '入门',
      wpLabel: 'WordPress插件',
      toggleNav: '切换导航',
      close: '关闭',
      perYear: '/年',
      perMonth: '/月',
    },
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
    if (enSlug === 'about') return `/${lang}/`;
    return `/${lang}/${getPath(lang, enSlug)}`;
  }

  return {
    supportedLanguages,
    allLanguages,
    nativeNames,
    canonicalPaths,
    paths,
    nav,
    getPath,
    getCanonicalSlug,
    getNav,
    buildPath,
  };
})();
