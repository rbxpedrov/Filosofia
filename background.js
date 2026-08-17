(function(){
  const ROTATE_MINUTES = 0.1; // troque aqui pra mudar o intervalo
  const FOLDER = 'assets/background/';
  const FALLBACK = 'assets/Beckgraud.png';

  const container = document.querySelector('.hero-image');
  if(!container) return;
  const fadeOverlay = container.querySelector('.hero-image-fade');
  let currentImg = container.querySelector('.hero-image-img');
  let currentFile = FALLBACK;
  let pool = [];

  const reducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FADE_MS = reducedMotion ? 50 : 1650;

  function pickNext(){
    if(pool.length === 0) return null;
    if(pool.length === 1) return FOLDER + pool[0];
    let choice;
    do {
      choice = FOLDER + pool[Math.floor(Math.random() * pool.length)];
    } while(choice === currentFile);
    return choice;
  }

  function swapTo(src){
    const incoming = document.createElement('img');
    incoming.alt = '';
    incoming.className = 'hero-image-img is-incoming';
    incoming.onload = () => {
      container.insertBefore(incoming, fadeOverlay);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          incoming.classList.remove('is-incoming');
          currentImg.style.opacity = '0';
        });
      });
      setTimeout(() => {
        currentImg.remove();
        currentImg = incoming;
        currentFile = src;
      }, FADE_MS);
    };
    incoming.onerror = () => {
    };
    incoming.src = src;
  }

  function rotate(){
    const next = pickNext();
    if(next && next !== currentFile) swapTo(next);
  }

  fetch(FOLDER + 'manifest.json')
    .then(r => r.ok ? r.json() : [])
    .then(list => {
      pool = Array.isArray(list) ? list.filter(Boolean) : [];
      if(pool.length === 0) return;
      const first = pickNext();
      if(first){
        currentImg.src = first;
        currentFile = first;
      }
      setInterval(rotate, ROTATE_MINUTES * 60 * 1000);
    })
    .catch(() => {});
})();
