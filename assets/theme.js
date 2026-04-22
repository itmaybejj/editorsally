(() => {
  'use strict'

  /* i18n configuration from lang/i18n.js (loaded before theme.js) */
  const i18n = (typeof defined_i18n !== 'undefined') ? defined_i18n : null;
  const validTranslations = i18n ? i18n.supportedLanguages : [];
  const validPaths = i18n ? i18n.canonicalPaths.concat(['codes']) : ['about', 'features', 'demo', 'contacts', 'install', 'drupal', 'license', 'codes'];
  const allLangs = i18n ? i18n.allLanguages : ['en'];
  const langCode = allLangs.includes(document.documentElement.lang) ? document.documentElement.lang : 'en';
  const strings = i18n ? i18n.getNav(langCode) : null;
  const externalIcon = `<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="14" fill="currentColor" class="bi bi-arrow-right-square" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M15 2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1zM0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm4.5 5.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5z"/>
</svg>`;

  function p(enSlug) {
    return i18n ? i18n.buildPath(langCode, enSlug) : `/${langCode}/${enSlug}`;
  }
  function l(enSlug) {
    return strings ? strings.label[enSlug] : { about: 'About', features: 'Features', demo: 'Demo', contacts: 'Contacts', install: 'Install &amp; Configure', drupal: 'Drupal Module', license: 'Pricing &amp; Contributions' }[enSlug];
  }

  const navTemplate = `
            <li class="nav-item">
              <a href="${p('about')}" class="nav-link">${l('about')}</a>
            </li>
            <li class="nav-item"><a href="${p('features')}" class="nav-link">${l('features')}</a></li>
            <li class="nav-item"><a href="${p('demo')}" class="nav-link">${l('demo')}</a></li>
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                ${strings ? strings.gettingStarted : 'Getting Started'}
              </a>
              <ul class="dropdown-menu">
                <li><a class="dropdown-item" href="${p('install')}">${l('install')}</a></li>
                <li><a class="dropdown-item" href="${p('license')}">${l('license')}</a></li>
                <li><a class="dropdown-item" href="${p('drupal')}">${l('drupal')}</a></li>
                <li><a class="dropdown-item" href="https://wordpress.org/plugins/editoria11y-accessibility-checker/" title="External link">${strings ? strings.wpLabel : 'WordPress Plugin'} ${externalIcon}</a></li>
                <li><a class="dropdown-item" href="${p('contacts')}">${l('contacts')}</a></li>

    `;
  const nav = document.querySelector('header .navbar-nav');
  nav.innerHTML = navTemplate;

  /* Override brand link to point to language root */
  const brandLink = document.querySelector('header .navbar-brand');
  if (brandLink) brandLink.setAttribute('href', p('about'));

  /* Determine current canonical slug from URL */
  const currentPath = window.location.pathname;
  const pathParts = currentPath.replace(/^\/|\/$/g, '').split('/');
  const currentSlug = pathParts.length > 1 ? pathParts[pathParts.length - 1] : 'about';
  const currentCanonical = i18n ? i18n.getCanonicalSlug(langCode, currentSlug) : currentSlug;

  /* Active link highlighting */
  const navLinks = nav.querySelectorAll('a');
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (!href || href === '#' || href.startsWith('http')) return;
    const linkParts = href.replace(/^\/|\/$/g, '').split('/');
    const linkSlug = linkParts.length > 1 ? linkParts[linkParts.length - 1] : 'about';
    const linkCanonical = i18n ? i18n.getCanonicalSlug(langCode, linkSlug) : linkSlug;
    if (linkCanonical === currentCanonical) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });

  /* Language picker */
  const pickerEl = document.getElementById('lang-picker');
  if (pickerEl && i18n) {
    const translateIcon = `<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-translate" viewBox="0 0 16 16">
      <path d="M4.545 6.714 4.11 8H3l1.862-5h1.284L8 8H6.833l-.435-1.286zm1.634-.736L5.5 3.956h-.049l-.679 2.022z"></path>
      <path d="M0 2a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v3h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-3H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zm7.138 9.995q.289.451.63.846c-.748.575-1.673 1.001-2.768 1.292.178.217.451.635.555.867 1.125-.359 2.08-.844 2.886-1.494.777.665 1.739 1.165 2.93 1.472.133-.254.414-.673.629-.89-1.125-.253-2.057-.694-2.82-1.284.681-.747 1.222-1.651 1.621-2.757H14V8h-3v1.047h.765c-.318.844-.74 1.546-1.272 2.13a6 6 0 0 1-.415-.492 2 2 0 0 1-.94.31"></path>
    </svg>`;
    const items = i18n.allLanguages
      .filter(code => code !== langCode)
      .map(code => {
        const href = i18n.buildPath(code, currentCanonical);
        const name = i18n.nativeNames[code] || code;
        return `<li><a class="dropdown-item" href="${href}">${name}</a></li>`;
      })
      .join('');
    pickerEl.innerHTML = `
      <div class="dropdown lang-picker d-flex align-items-center">
        <button type="button" data-bs-toggle="dropdown" title="Language" aria-expanded="false"
          class="btn btn-outline-primary btn-sm dropdown-toggle rounded-0 rounded-bottom border-top-0 mx-auto">
          ${translateIcon}
          <span>${langCode.toUpperCase()}</span>
        </button>
        <ul class="dropdown-menu">${items}</ul>
      </div>`;
  }

  if (currentPath === '/' || (currentPath === '/codes/')) {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const typeValue = urlParams.get('p');
    let goTo = 'en'
    if (navigator.languages
    ) {
      const intersection = navigator.languages.filter(item => validTranslations.includes(item));
      if (intersection.length) {
        goTo = intersection[0];
      }
    };
    if (currentPath === '/codes/') {
      window.location.replace(`/${langCode}/license`);
    } else if (typeValue && validPaths.includes(typeValue)) {
      window.location.replace(i18n ? i18n.buildPath(goTo, typeValue) : `/${goTo}/${typeValue}`);
    } else {
      window.location.replace(`/${goTo}/`);
    }
  }

  /* On this page **********************/

  const onThisPage = document.querySelector('#on-this-page');
  if (onThisPage) {
    const headings = document.querySelectorAll(':is(h1, h2, h3):not(.nomenu)');
    headings?.forEach(heading => {
      heading.setAttribute('tabindex', '-1');
      const link = document.createElement('a');
      link.setAttribute('class', 'list-group-item list-group-item-action was-h2')
      link.textContent = heading.textContent;
      let theLink = heading.id ? heading.id : heading.closest('[id]')?.id;
      if (!theLink) {
        theLink = heading.textContent.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
        heading.setAttribute('id', theLink);
      }
      link.setAttribute('href', `#${theLink}`);
      if (heading.tagName === 'H3') {
        link.classList.add('small', 'pt-1', 'pb-1', 'was-h3');
        link.classList.remove('was-h2');
        const sym = document.createElement('span');
        sym.setAttribute('aria-hidden', 'true');
        sym.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="13" fill="currentColor" class="bi bi-chevron-right me-1" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708"/>
        </svg>`
        link.prepend(sym);
      }
      onThisPage.appendChild(link);
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        const target = document.querySelector(href);
        if (target) {
          target.focus();
          window.location.replace(href)
        }
      });
    });
  }

  /* Pricing page **********************/

  const pricePicker = document.getElementById('price-pick');
  const pricing = {
    monthly: {
      USD: {
        1: '16.65',
        5: '81',
        25: '181',
        50: '331',
        200: '748',
        500: '1665',
        1000: '3331',
        unlimited: '4498'
      },
      GBP: {
        1: '13.33',
        5: '65',
        25: '148',
        50: '265',
        200: '548',
        500: '1331',
        1000: '2665',
        unlimited: '3331'
      },
      EUR: {
        1: '14.99',
        5: '73',
        25: '165',
        50: '331',
        200: '664',
        500: '1497',
        1000: '2998',
        unlimited: '3998'
      }
    },
    yearly: {
      USD: {
        1: '165',
        5: '708',
        25: '1831',
        50: '3331',
        200: '4998',
        500: '16665',
        1000: '29998',
        unlimited: '44998'
      },
      GBP: {
        1: '131',
        5: '648',
        25: '1498',
        50: '2664',
        200: '5498',
        500: '13331',
        1000: '26664',
        unlimited: '33331'
      },
      EUR: {
        1: '148',
        5: '665',
        25: '1665',
        50: '2998',
        200: '4665',
        500: '14998',
        1000: '28333',
        unlimited: '39998'
      }
    }
  };
  if (pricePicker) {

    const currencySelect = document.getElementById('currency');
    const annualCheckbox = document.getElementById('annual-pricing');
    const supportSelect = document.getElementById('support-level');
    const currencySymbols = { EUR: '€', USD: '$', GBP: '£' };
    const couponCodes = { 100: null, 80: '120', 60: '100', 50: '75', 44: '66', 33: '50', 22: '33', 17: '25' };

    function buildCheckoutUrl(licenses) {
      // @todo: include language code in URL and re-enable when checkout supports it.
      const currency = currencySelect.value.toLowerCase();
      const billingCycle = annualCheckbox.checked ? 'annual' : 'monthly';
      const couponPrefix = couponCodes[parseInt(supportSelect.value, 10)];
      const licenseUrl = `https://editoria11y.com/${langCode}/license`;
      let url = `https://checkout.freemius.com/bundle/26223/plan/43392/licenses/${licenses}/currency/${currency}/?show_upsells=false&disable_licenses_selector=true&billing_cycle=${billingCycle}&annual_discount=false&cart=false&&bundle_discount=false&multisite_discount=false&cancel_url=${encodeURIComponent(licenseUrl)}`;
      if (couponPrefix) {
        url += `&coupon=${couponPrefix}px&hide_coupon=true`;
      }
      return url;
    }

    function formatPrice(num) {
      const str = num.toFixed(2);
      const clean = str.endsWith('.00') || num > 16 ? Math.ceil(num).toString() : str;
      return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    function applyPrice(container, baseStr, multiplier, symbol, periodText) {
      const base = parseFloat(baseStr.replace(/,/g, ''));
      const final = base * multiplier;
      container.querySelector('.currency').textContent = symbol;
      container.querySelector('.price').textContent = formatPrice(final);
      container.querySelector('.period').textContent = periodText;
    }

    function updatePrices() {
      const supportLevel = parseInt(supportSelect.value, 10);
      const currency = currencySelect.value;
      const symbol = currencySymbols[currency];
      const multiplier = supportLevel / 100;
      const isAnnual = annualCheckbox.checked;
      const period = isAnnual ? 'yearly' : 'monthly';
      const periodText = isAnnual ? (strings?.perYear || '/year') : (strings?.perMonth || '/month');
      const prices = pricing[period][currency];

      // 75px aka 50% is the lowest value to allow for monthly.

      document.querySelectorAll('.no-credit')?.forEach(el => el.classList.remove('no-credit'));

      // Individual logic.

      if (supportLevel < 50) {
        applyPrice(document.getElementById('individual'), pricing['yearly'][currency]['1'], multiplier, symbol, strings?.perYear || '/year');
        document.querySelector('#individual').classList.add('annual-only');
      } else {
        applyPrice(document.getElementById('individual'), prices['1'], multiplier, symbol, periodText);
        document.querySelector('#individual').classList.remove('annual-only');
      }
      if (supportLevel < 100) {
        document.querySelector('#individual').classList.add('no-credit');
      }

      // team Credits
      if (
        (supportLevel < 22 && ['5', '10', '25', '50', '200'].includes(pricePicker.value)) ||
        (supportLevel < 33 && ['5', '10', '25', '50'].includes(pricePicker.value)) ||
        (supportLevel < 50 && ['5', '10', '25', '50'].includes(pricePicker.value))
      ) {
        document.querySelector('#team').classList.add('no-credit');
      }

      // team annual-only.
      if (['5', '10'].includes(pricePicker.value) && supportLevel < 22) {
        applyPrice(document.getElementById('price-result'), pricing['yearly'][currency][pricePicker.value], multiplier, symbol, strings?.perYear || '/year');
        document.querySelector('#team').classList.add('annual-only');
      } else {
        applyPrice(document.getElementById('price-result'), prices[pricePicker.value], multiplier, symbol, periodText);
        document.querySelector('#team').classList.remove('annual-only');
      }
      applyPrice(document.getElementById('enterprise'), prices['unlimited'], multiplier, symbol, periodText);

      document.querySelector('#individual .btn').href = buildCheckoutUrl(1);
      document.querySelector('#price-result .btn').href = buildCheckoutUrl(pricePicker.value);
      document.querySelector('#enterprise .btn').href = buildCheckoutUrl('unlimited');

    }

    pricePicker.addEventListener('change', updatePrices);
    currencySelect.addEventListener('change', updatePrices);
    annualCheckbox.addEventListener('change', updatePrices);
    supportSelect.addEventListener('change', updatePrices);
    updatePrices();
  }

  /* Theme switcher **********************/
  /*
    const themeSwitch = `
      <svg xmlns="http://www.w3.org/2000/svg" class="d-none">
        <symbol id="arrow-right-circle" viewBox="0 0 16 16">
          <path
            d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zM4.5 7.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H4.5z"
          ></path>
        </symbol>
      </svg>`
    const themeSwitcher = document.createElement('div');
    themeSwitcher.innerHTML = themeSwitch;
    document.body.appendChild(themeSwitcher);*/
  /*!
 * Color mode toggler for Bootstrap's docs (https://getbootstrap.com/)
 * Copyright 2011-2025 The Bootstrap Authors
 * Licensed under the Creative Commons Attribution 3.0 Unported License.
 */
  /*
    const getStoredTheme = () => localStorage.getItem('theme')
    const setStoredTheme = theme => localStorage.setItem('theme', theme)
  
    const getPreferredTheme = () => {
      const storedTheme = getStoredTheme()
      if (storedTheme) {
        return storedTheme
      }
  
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
  
    const setTheme = theme => {
      if (theme === 'auto') {
        document.documentElement.setAttribute('data-bs-theme', (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))
      } else {
        document.documentElement.setAttribute('data-bs-theme', theme)
      }
    }
  
    setTheme(getPreferredTheme())
  
    const showActiveTheme = (theme, focus = false) => {
      const themeSwitcher = document.querySelector('#bd-theme')
  
      if (!themeSwitcher) {
        return
      }
  
      const themeSwitcherText = document.querySelector('#bd-theme-text')
      const activeThemeIcon = document.querySelector('.theme-icon-active use')
      const btnToActive = document.querySelector(`[data-bs-theme-value="${theme}"]`)
      const svgOfActiveBtn = btnToActive.querySelector('svg use').getAttribute('href')
  
      document.querySelectorAll('[data-bs-theme-value]').forEach(element => {
        element.classList.remove('active')
        element.setAttribute('aria-pressed', 'false')
      })
  
      btnToActive.classList.add('active')
      btnToActive.setAttribute('aria-pressed', 'true')
      activeThemeIcon.setAttribute('href', svgOfActiveBtn)
      const themeSwitcherLabel = `${themeSwitcherText.textContent} (${btnToActive.dataset.bsThemeValue})`
      themeSwitcher.setAttribute('aria-label', themeSwitcherLabel)
  
      if (focus) {
        themeSwitcher.focus()
      }
    }
  
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      const storedTheme = getStoredTheme()
      if (storedTheme !== 'light' && storedTheme !== 'dark') {
        setTheme(getPreferredTheme())
      }
    })
  
    window.addEventListener('DOMContentLoaded', () => {
      showActiveTheme(getPreferredTheme())
  
      document.querySelectorAll('[data-bs-theme-value]')
        .forEach(toggle => {
          toggle.addEventListener('click', () => {
            const theme = toggle.getAttribute('data-bs-theme-value')
            setStoredTheme(theme)
            setTheme(theme)
            showActiveTheme(theme, true)
          })
        })
    })*/
  const circleIcon = document.createElement('span');
  circleIcon.classList.add('d-none');
  circleIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="d-none">
      <symbol id="arrow-right-circle" viewBox="0 0 16 16">
        <path
          d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zM4.5 7.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H4.5z"
        ></path>
      </symbol>
    </svg>`
  document.body.appendChild(circleIcon);

  const linkIcon = document.createElement('span');
  linkIcon.innerHTML = `<svg class="bi" width="20" height="20" aria-hidden="true">
                  <use xlink:href="#arrow-right-circle"></use>
                </svg>`;
  const arrowItems = document.querySelectorAll('.arrow');
  arrowItems.forEach((arrow) => {
    arrow.classList.add('icon-link', 'mb-1');
    arrow.prepend(linkIcon.cloneNode(true));
  });
})()
