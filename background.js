// ---- rotação da imagem de topo (assets/background/) ----
// Troca a imagem do topo por uma aleatória a cada X minutos, com um
// crossfade suave. Pra adicionar uma foto nova:
//   1. Suba o arquivo em assets/background/
//   2. Acrescente o nome exato do arquivo na lista em
//      assets/background/manifest.json
// Sem o passo 2, a imagem existe na pasta mas não entra no sorteio —
// o site não consegue "ver" a pasta sozinho, só o que está no manifest.
(function(){
  const ROTATE_MINUTES = 6; // troque aqui pra mudar o intervalo
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
      // duplo rAF: garante que o navegador registre a opacidade 0 antes
      // de tirarmos a classe, senão a transição não roda (ela pularia
      // direto pro estado final).
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
      // arquivo quebrado, renomeado ou removido: não trava nada,
      // só tenta de novo na próxima rodada.
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
      if(pool.length === 0) return; // manifest vazio: fica só na imagem padrão
      setInterval(rotate, ROTATE_MINUTES * 60 * 1000);
    })
    .catch(() => {});
})();
