(function(){
  const btn = document.querySelector('[data-nav-toggle]');
  const panel = document.querySelector('[data-nav-panel]');
  if(btn && panel){
    const close = () => {
      panel.classList.remove('open');
      btn.setAttribute('aria-expanded','false');
      document.documentElement.classList.remove('nav-open');
    };

    btn.addEventListener('click', () => {
      const isOpen = panel.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(isOpen));
      document.documentElement.classList.toggle('nav-open', isOpen);
    });

    // close on outside click
    document.addEventListener('click', (e) => {
      if(!panel.classList.contains('open')) return;
      if(panel.contains(e.target) || btn.contains(e.target)) return;
      close();
    });

    // close on escape
    document.addEventListener('keydown', (e) => {
      if(e.key === 'Escape') close();
    });

    // close when a nav link is clicked
    panel.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if(!a) return;
      close();
    });
  }
})();
