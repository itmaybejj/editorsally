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
  const headerTemplate = `
    <header>
    <nav class="navbar navbar-expand-md bg-body-secondary">
        <div class="container p-2 py-0 col-sm-12 mx-auto">
        <a href="../about" class="d-flex align-items-center  link-body-emphasis text-decoration-none navbar-brand">
            <span class="fs-2">Editoria<span style="margin-left: -1px;">11</span>y</span>
          </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasNavbar" aria-controls="offcanvasNavbar" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="offcanvas offcanvas-end" tabindex="-1" id="offcanvasNavbar" aria-labelledby="offcanvasNavbarLabel">
        <div class="offcanvas-header">
            <h5 class="offcanvas-title" id="offcanvasNavbarLabel">Editora11y</h5>
            <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>
        <div class="offcanvas-body">
          <ul class="navbar-nav justify-content-end flex-grow-1 pt-2 nav-pills">
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
                <li>
                  <hr class="dropdown-divider">
                </li>
                <li><a class="dropdown-item" href="https://editoria11y.princeton.edu/install" title="External link">Library configuration <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-right-square" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M15 2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1zM0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm4.5 5.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5z"/>
</svg></a></li>
              </ul>
            </li>
          </ul>
        </div>
        </div>
      </div>
    </nav>
   </header>
    `
  const headerElement = document.createElement('div');
  headerElement.innerHTML = headerTemplate;

  document.querySelector('body').prepend(headerElement);
  const navLinks = document.querySelectorAll('header .nav-link');
  const currentPath = window.location.pathname;
  navLinks.forEach(link => {
    if (link.getAttribute('href') !== '/' && currentPath.includes(link.getAttribute('href'))) {
      console.log(link.href);
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
