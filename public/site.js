// Progressive enhancement: navigation remains available when JavaScript is disabled.
const toggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#main-nav');
if (toggle && navigation) {
  toggle.hidden = false;
  document.documentElement.classList.add('js');
  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
  });
  navigation.addEventListener('click', () => toggle.setAttribute('aria-expanded', 'false'));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      toggle.setAttribute('aria-expanded', 'false');
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
