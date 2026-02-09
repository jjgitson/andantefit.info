(function(){
  const btn = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');
  if(!btn || !nav) return;

  const close = () => {
    nav.classList.remove('is-open');
    btn.setAttribute('aria-expanded','false');
  };

  btn.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', String(isOpen));
  });

  document.addEventListener('click', (e) => {
    if(!nav.classList.contains('is-open')) return;
    if(nav.contains(e.target) || btn.contains(e.target)) return;
    close();
  });

  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape') close();
  });

  nav.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if(!a) return;
    if(window.matchMedia('(max-width: 900px)').matches) close();
  });
})();