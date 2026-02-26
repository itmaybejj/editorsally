const demo = async () => {

  let iframePlaceholder = `
    <!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>example</title></head>
    <body><div style="position: absolute; top:0; bottom: 0; left:0; right:0; border: 2px #444; background: #eee; display: flex; align-items: center; justify-content: center; font-size: 10vw; font-family: monospace;">&lt; iframe &gt;</div>
    </body></html>
    `;

  const iframeBlob = new Blob([iframePlaceholder], { type: 'text/html' });

// 3. Generate a blob URL from the Blob object
  const iSrc = URL.createObjectURL(iframeBlob);

  document.querySelectorAll('[data-needs-src]')?.forEach(frame=> {
    frame.src = iSrc;
  });

  const langFiles = [
    'en-us',
    'en',
    'da',
    'de',
    'el',
    'es',
    'fr',
    'hu',
    'it',
    'jp',
    'nb',
    'nl',
    'pl',
    'pt-br',
    'pt-pt',
    'sv',
    'zh',
  ];
  const docLang = document.documentElement.lang;
  let lang = langFiles.includes(docLang) ? docLang : 'en-us';


  const today = new Date();
  const version = `${today.getFullYear()}${String(today.getMonth())}${String(today.getDate())}`;
  const modulePromises = [
    import(`/assets/ed11y/js/ed11y.esm.js?cacheBust=${version}`),
    import(`/assets/ed11y/js/lang/${lang}.js?cacheBust=${version}`)
  ];

  const [Ed11y, ed11yLang] = await Promise.all(modulePromises).then();
  const foo = new Ed11y.Ed11y({
    alertMode : 'active',
    theme: 'sleekTheme',
    panelNoCover: '#bd-theme',
    embeddedContentPlugin: true,
    linksAdvancedPlugin: true,
    developerPlugin: true,
    checks: {
      IMAGE_FIGURE_DECORATIVE: true, // csa controlled
      IMAGE_FIGURE_DUPLICATE_ALT: true,

      HEADING_FIRST: false,

      // Link checks
      LINK_FILE_EXT: true, // @todo test v LinkPurpose

      // Embedded content checks
      EMBED_UNFOCUSABLE: true,
      EMBED_MISSING_TITLE: true,
      EMBED_GENERAL: true,

      // Quality assurance checks
      QA_BAD_LINK: {
        sources: '',
      },
      QA_NESTED_COMPONENTS: {
        sources: '',
      },
      QA_JUSTIFY: true,

      LINK_URL: {
        maxLength: 20,
      },

      LINK_NEW_TAB: true,
      IMAGE_DECORATIVE_CAROUSEL: true, // csa
      IMAGE_FIGURE_DECORATIVE: true,
      DUPLICATE_TITLE: {
        dismissAll: true,
      },
      LINK_EMPTY_LABELLEDBY: true,
      LINK_STOPWORD_ARIA: true,
      LINK_IDENTICAL_NAME: {
        dismissAll: true,
      },
      LABELS_MISSING_IMAGE_INPUT: true,
      LABELS_INPUT_RESET: true,
      LABELS_MISSING_LABEL: true,
      LABELS_ARIA_LABEL_INPUT: true,
      LABELS_NO_FOR_ATTRIBUTE: true,
      LABELS_PLACEHOLDER: true,
      EMBED_UNFOCUSABLE: true,
      QA_SMALL_TEXT: true,
      // Meta checks
      META_LANG: true,
      META_SCALABLE: true,
      META_MAX: true,
      META_REFRESH: true,
      META_TITLE: true,
      // Developer checks
      DUPLICATE_ID: true,
      UNCONTAINED_LI: true,
      TABINDEX_ATTR: true,
      HIDDEN_FOCUSABLE: true,
      LABEL_IN_NAME: true,
      BTN_EMPTY: true,
      BTN_EMPTY_LABELLEDBY: true,
      BTN_ROLE_IN_NAME: true,

      // Contrast checks
      CONTRAST_WARNING: {
        dismissAll: true,
      },
      CONTRAST_INPUT: true,
      CONTRAST_ERROR: true,
      CONTRAST_PLACEHOLDER: true,
      CONTRAST_PLACEHOLDER_UNSUPPORTED: true,
      CONTRAST_ERROR_GRAPHIC: { type: 'warning' },
      CONTRAST_WARNING_GRAPHIC: true,
      CONTRAST_UNSUPPORTED: {
        dismissAll: true,
      },
      EMBED_VIDEO: {
        sources: 'youtube-nocookie.com',
      },
    },
  });
}

demo().then();
