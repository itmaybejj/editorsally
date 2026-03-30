(() => {
  'use strict'

  /*const headerTemplate = `
        <header class="container d-flex flex-wrap justify-content-center p-4 py-3 border-bottom col-sm-12 mx-auto">
          <a href="../about" class="d-flex align-items-center mb-3 mb-md-0 me-md-auto link-body-emphasis text-decoration-none">
            <span class="fs-4">Editor's <strong>Ally</strong></span>
          </a>
          <ul class="navbar navbar-expand-lg nav nav-pills">
            <li class="nav-item">
              <a href="../about" class="nav-link">About</a>
            </li>
            <li class="nav-item"><a href="../projects" class="nav-link">Projects</a></li>
            <li class="nav-item"><a href="../membership" class="nav-link">Membership</a></li>
            <li class="nav-item"><a href="../contacts" class="nav-link">Contacts</a></li>
          </ul>
        </header>`;*/
  // const validTranslations = ['da', 'de', 'el', 'es', 'fr', 'hu', 'it', 'jp', 'nb', 'nl', 'pl', 'pt-br', 'pt-pt', 'sv', 'uk', 'zh'];\
  const validTranslations = [];
  const validPaths = ['about', 'features', 'add-ons', 'contacts', 'install', 'drupal', 'license', 'codes'];
  const langCode = validTranslations.includes(document.documentElement.lang) ? document.documentElement.lang : 'en';
  const navTemplate = `
    
            <li class="nav-item">
              <a href="/${langCode}/about" class="nav-link">About</a>
            </li>
            <!--<li class="nav-item"><a href="/${langCode}/projects" class="nav-link">Projects</a></li>-->
            <li class="nav-item"><a href="/${langCode}/features" class="nav-link">Features</a></li>
            <li class="nav-item"><a href="/${langCode}/add-ons" class="nav-link">Add-ons</a></li>
            <!--<li class="nav-item"><a href="/${langCode}/contacts" class="nav-link">Contacts</a></li>-->
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                Getting Started
              </a>
              <ul class="dropdown-menu">
                <li><a class="dropdown-item" href="../install">Install &amp; Configure</a></li>
                <li><a class="dropdown-item" href="../license">License &amp; Contribute</a></li>
                <li><a class="dropdown-item" href="../drupal">Drupal Module</a></li>
                <li><a class="dropdown-item" href="https://wordpress.org/plugins/editoria11y-accessibility-checker/" title="External link">WordPress Plugin <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="14" fill="currentColor" class="bi bi-arrow-right-square" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M15 2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1zM0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm4.5 5.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5z"/>
</svg></a></li>
                <li><a class="dropdown-item" href="../contacts">Contacts</a></li>

    `
  const nav = document.querySelector('header .navbar-nav');
  nav.innerHTML = navTemplate;
  const navLinks = nav.querySelectorAll('a');
  const currentPath = window.location.pathname;
  navLinks.forEach(link => {
    if (link.getAttribute('href') !== '/' && currentPath.includes(link.getAttribute('href').replaceAll('..', ''))) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });

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
      window.location.replace(`/${langCode}/${typeValue}`);
    } else {
      window.location.replace(`/${goTo}/about`);
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

  const pricePicker = document.getElementById('price-pick');
  const pricing = {
    monthly: {
      USD: {
        1: '16.65',
        5: '82',
        25: '183',
        50: '332',
        200: '749',
        500: '1665',
        1000: '3332',
        unlimited: '4499'
      },
      GBP: {
        1: '13.33',
        5: '65',
        25: '149',
        50: '265',
        200: '549',
        500: '1333',
        1000: '2666',
        unlimited: '3333'
      },
      EUR: {
        1: '14.99',
        5: '73',
        25: '165',
        50: '333',
        200: '664',
        500: '1497',
        1000: '2999',
        unlimited: '3999'
      }
    },
    yearly: {
      USD: {
        1: '165.5',
        5: '709',
        25: '1833',
        50: '3332',
        200: '4999',
        500: '16666',
        1000: '29999',
        unlimited: '44999'
      },
      GBP: {
        1: '133',
        5: '649',
        25: '1499',
        50: '2665',
        200: '5499',
        500: '13333',
        1000: '26666',
        unlimited: '33333'
      },
      EUR: {
        1: '149',
        5: '665',
        25: '1666',
        50: '2999',
        200: '4666',
        500: '14999',
        1000: '28333',
        unlimited: '39999'
      }
    }
  };
  if (pricePicker) {
    const currencySelect = document.getElementById('currency');
    const annualCheckbox = document.getElementById('annual-pricing');
    const supportSelect = document.getElementById('support-level');
    const currencySymbols = { EUR: '€', USD: '$', GBP: '£' };

    function formatPrice(num) {
      const str = num.toFixed(2);
      const clean = str.endsWith('.00') || num > 16 ? str.slice(0, -3) : str;
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
      const periodText = isAnnual ? '/year' : '/month';
      const prices = pricing[period][currency];

      // 75px aka 50% is the lowest value to allow for monthly.

      document.querySelectorAll('.no-credit')?.forEach(el => el.classList.remove('no-credit'));

      // Individual logic.
      
      if (supportLevel < 50) {
        applyPrice(document.getElementById('individual'), pricing['yearly'][currency]['1'], multiplier, symbol, '/year');
        document.querySelector('#individual').classList.add('annual-only');
      } else {
        applyPrice(document.getElementById('individual'), prices['1'], multiplier, symbol, periodText);
        document.querySelector('#individual').classList.remove('annual-only');
      }
      if (supportLevel < 100) {
        document.querySelector('#individual').classList.add('no-credit');
      }

      // Agency Credits
      if (
          (supportLevel < 22 && ['5','10','25','50','200'].includes(pricePicker.value)) ||
          (supportLevel < 33 && ['5','10','25','50'].includes(pricePicker.value)) ||
          (supportLevel < 50 && ['5','10','25'].includes(pricePicker.value))
        ) {
        document.querySelector('#agency').classList.add('no-credit');
      }

      // Agency annual-only.
      if (pricePicker.value === '5' && supportLevel < 22) {
        applyPrice(document.getElementById('price-result'), pricing['yearly'][currency]['5'], multiplier, symbol, '/year');
        document.querySelector('#agency').classList.add('annual-only');
      } else {
        applyPrice(document.getElementById('price-result'), prices[pricePicker.value], multiplier, symbol, periodText);
        document.querySelector('#agency').classList.remove('annual-only');
      }
      applyPrice(document.getElementById('enterprise'), prices['unlimited'], multiplier, symbol, periodText);
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
