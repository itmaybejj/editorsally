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
  const langCode = validTranslations.includes(document.documentElement.lang) ? document.documentElement.lang : 'en';
  const navTemplate = `
    
            <li class="nav-item">
              <a href="/${langCode}/about" class="nav-link">About</a>
            </li>
            <!--<li class="nav-item"><a href="/${langCode}/projects" class="nav-link">Projects</a></li>-->
            <li class="nav-item"><a href="/${langCode}/demo" class="nav-link">Demo</a></li>
            <li class="nav-item"><a href="/${langCode}/community" class="nav-link">Community</a></li>
            <!--<li class="nav-item"><a href="/${langCode}/contacts" class="nav-link">Contacts</a></li>-->
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                Getting Started
              </a>
              <ul class="dropdown-menu">
                <li><a class="dropdown-item" href="../drupal">Drupal CSA Module</a></li>
                <!--<li><a class="dropdown-item" href="#">WordPress plugin</a></li>-->
                <li><a class="dropdown-item" href="https://editoria11y.princeton.edu/install" title="External link">Library configuration <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-right-square" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M15 2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1zM0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm4.5 5.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5z"/>
</svg></a></li>
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
  if (currentPath === '/') {
    navLinks[0].classList.add('active');
    navLinks[0].setAttribute('aria-current', 'page');
    let goTo = 'en'
    if (navigator.languages
    ) {
      const intersection = navigator.languages.filter(item => validTranslations.includes(item));
      if (intersection.length) {
        goTo = intersection[0];
      }
    };
    window.location.replace(`/${goTo}/about`);
  }

  /* Footer **********************/

  const footer = document.createElement('footer');
  footer.innerHTML = `
      &copy; Editoria11y 2026`;
  footer.setAttribute('class', 'container col-lg-12 mx-auto pt-5 my-5 text-body-secondary border-top');
  document.body.appendChild(footer);

  /* On this page **********************/

  const onThisPage = document.querySelector('#on-this-page');
  if (onThisPage) {
    const headings = document.querySelectorAll('h2, h3');
    headings?.forEach(heading => {
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
    })
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
  linkIcon.innerHTML = `<svg class="bi" width="16" height="16" aria-hidden="true">
                  <use xlink:href="#arrow-right-circle"></use>
                </svg>`;
  const arrowItems = document.querySelectorAll('.arrow');
  arrowItems.forEach((arrow) => {
    arrow.classList.add('icon-link', 'mb-1');
    arrow.prepend(linkIcon.cloneNode(true));
  });
})()
