(function () {
  // ── Apply saved or system preference immediately (before paint) ──────
  const saved  = localStorage.getItem('sala_theme');
  const prefer = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const theme  = saved || prefer;
  document.documentElement.setAttribute('data-theme', theme);

  // ── Public toggle function 
  window.salaToggleDark = function () {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next    = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('sala_theme', next);
    updateIcon(next);
  };

  // ── Icon helper 
  function updateIcon(theme) {
    const ico = document.getElementById('darkToggleIcon');
    if (!ico) return;
    ico.className = theme === 'dark'
      ? 'fa-solid fa-sun'
      : 'fa-solid fa-moon';
  }

  // ── Run on DOMContentLoaded to set correct icon 
  document.addEventListener('DOMContentLoaded', () => {
    updateIcon(document.documentElement.getAttribute('data-theme') || 'light');
  });
})();
