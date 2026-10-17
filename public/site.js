// Progressive enhancement: navigation remains available when JavaScript is disabled.
const toggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#main-nav');
if (toggle && navigation) {
  toggle.hidden = false;
  document.documentElement.classList.add('js');
  const mobileMenu = matchMedia('(max-width: 760px)');
  const setExpanded = expanded => {
    toggle.setAttribute('aria-expanded', String(expanded));
    toggle.setAttribute('aria-label', expanded ? 'Close navigation menu' : 'Open navigation menu');
    navigation.inert = mobileMenu.matches && !expanded;
  };
  setExpanded(false);
  mobileMenu.addEventListener('change', () => setExpanded(false));
  toggle.addEventListener('click', () => setExpanded(toggle.getAttribute('aria-expanded') !== 'true'));
  navigation.addEventListener('click', event => {
    if (event.target.closest('a')) setExpanded(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setExpanded(false);
      toggle.focus();
    }
  });
}
// Gallery thumbnails keep their full-image link when JavaScript is disabled.
for (const gallery of document.querySelectorAll('.committee-gallery')) {
  const main = gallery.querySelector('.gallery-main');
  gallery.querySelectorAll('.gallery-thumbs a').forEach(link => {
    link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      main.src = link.href;
      main.alt = link.querySelector('img').alt;
      gallery.querySelectorAll('.gallery-thumbs a').forEach(item => item.removeAttribute('aria-current'));
      link.setAttribute('aria-current', 'true');
    });
  });
}

// Board year tabs: #board-2025 in the URL opens that year.
const boardTabs = [...document.querySelectorAll('.board-tab')];
if (boardTabs.length) {
  const select = tab => {
    const year = tab.getAttribute('aria-controls').replace('board-', '');
    for (const item of boardTabs) {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
    }
    document.querySelectorAll('[data-board-year]').forEach(element => { element.hidden = element.dataset.boardYear !== year; });
  };
  const fromHash = boardTabs.find(tab => '#' + tab.getAttribute('aria-controls') === location.hash);
  if (fromHash) select(fromHash);
  boardTabs.forEach((tab, i) => {
    tab.addEventListener('click', () => {
      select(tab);
      history.replaceState(null, '', i ? '#' + tab.getAttribute('aria-controls') : location.pathname);
    });
    tab.addEventListener('keydown', event => {
      const step = {ArrowRight: 1, ArrowLeft: -1}[event.key];
      if (!step) return;
      event.preventDefault();
      boardTabs[(i + step + boardTabs.length) % boardTabs.length].click();
      boardTabs.find(item => item.getAttribute('aria-selected') === 'true').focus();
    });
  });
}

// Keep the first screen filled when navigation wraps or the mobile viewport changes.
if (document.querySelector('.home-hero')) {
  const header = document.querySelector('header');
  const sizeHero = () => document.body.style.setProperty('--header-height', `${header.getBoundingClientRect().height}px`);
  sizeHero();
  new ResizeObserver(sizeHero).observe(header);
}
